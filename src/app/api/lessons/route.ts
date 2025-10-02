import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { lessonSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.LessonWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            // Teachers see lessons they teach or in classes where they are form masters
            where.OR = [
                { teacherid: session!.user.id },
                { class: { formmasterid: session!.user.id } }
            ];
        } else if (userRole === UserRole.PARENT) {
            // Parents see lessons in their children's classes
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
                subjectid: true,
                classid: true,
                teacherid: true,
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: { name: 'desc' }
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

        // Check for conflicting lessons (same teacher, day, and overlapping time)
        const conflictingLesson = await prisma.lesson.findFirst({
            where: {
                teacherid,
                day,
                OR: [
                    {
                        AND: [
                            { startTime: { lte: endTime } },
                            { endTime: { gte: startTime } }
                        ]
                    }
                ]
            }
        });

        if (conflictingLesson) {
            return NextResponse.json(
                { error: 'Teacher already has a lesson scheduled at this time' },
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
                subjectid: true,
                classid: true,
                teacherid: true,
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

        const result = await prisma.lesson.deleteMany({
            where: { id: { in: ids.map(id => parseInt(id)) } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} lessons`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete lessons');
    }
}