import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { lessonSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

function buildConflictPayload(lesson: any) {
    if (!lesson) return null;
    return {
        id: lesson.id,
        name: lesson.name,
        day: lesson.day,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        teacherid: lesson.teacherid,
        classid: lesson.classid,
        subjectid: lesson.subjectid,
    };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.LessonWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            where.OR = [
                { teacherid: session!.user.id },
                { class: { formmasterid: session!.user.id } }
            ];
        } else if (userRole === UserRole.PARENT) {
            where.class = {
                students: {
                    some: { parentid: session!.user.id }
                }
            };
        }

        const lessons = await prisma.lesson.findMany({
            where,
            select: {
                id: true,
                name: true,
                day: true,
                startTime: true,
                endTime: true,
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                    }
                }, subject: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            // schedule-friendly ordering
            orderBy: [
                { day: 'asc' },
                { startTime: 'asc' }
            ]
        });

        return successResponse({ data: lessons });
    } catch (error) {
        return handleError(error, 'Failed to fetch lessons');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, lessonSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { name, day, startTime, endTime, subjectid, classid, teacherid } = bodyValidation.data!;

        // Validate subjectid, classid, and teacherid
        const subject = await prisma.subject.findUnique({ where: { id: subjectid } });
        if (!subject) {
            return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
        }

        const classData = await prisma.class.findUnique({ where: { id: classid } });
        if (!classData) {
            return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
        }

        const teacher = await prisma.teacher.findUnique({ where: { id: teacherid } });
        if (!teacher) {
            return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
        }

        // Validate times are valid ISO datetimes and start < end
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return NextResponse.json(
                { error: 'Invalid start Time.' },
                { status: 400 }
            );
        }

        // Overlap if existing.start < newEnd && existing.end > newStart
        const conflictingLesson = await prisma.lesson.findFirst({
            where: {
                teacherid,
                day,
                AND: [
                    { startTime: { lt: end.toISOString() } },
                    { endTime: { gt: start.toISOString() } }
                ]
            }
        });

        if (conflictingLesson) {
            return NextResponse.json(
                {
                    error: 'Scheduling conflict: teacher already has a lesson at this time.',
                    conflict: buildConflictPayload(conflictingLesson)
                },
                { status: 409 }
            );
        }

        const newLesson = await prisma.lesson.create({
            data: {
                name,
                day,
                startTime,
                endTime,
                subjectid,
                classid,
                teacherid
            },
            select: {
                id: true,
                name: true,
                day: true,
                startTime: true,
                endTime: true,
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                    }
                }, subject: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            }
        });

        return successResponse(newLesson, 201);
    } catch (error) {
        return handleError(error, 'Failed to create lesson');
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');

        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // convert and validate numeric IDs
        const numericIds = ids.map(id => {
            const n = Number(id);
            return Number.isInteger(n) ? n : NaN;
        });

        if (numericIds.some(Number.isNaN)) {
            return NextResponse.json({ error: 'One or more IDs are invalid', invalidIds: ids.filter((_, i) => Number.isNaN(numericIds[i])) }, { status: 400 });
        }

        const result = await prisma.lesson.deleteMany({
            where: { id: { in: numericIds } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} lesson(s)`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete lessons');
    }
}
