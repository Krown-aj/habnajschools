import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { lessonUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the lesson exists
        const resourceCheck = await checkResourceExists(
            prisma.lesson,
            id,
            'Lesson not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.LessonWhereInput = { id: parseInt(id) };
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

        const lesson = await prisma.lesson.findFirst({
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
            }
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Access denied or lesson not found' }, { status: 403 });
        }

        return successResponse(lesson);
    } catch (error) {
        return handleError(error, 'Failed to fetch lesson');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.lesson,
            id,
            'Lesson not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, lessonUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { name, day, startTime, endTime, subjectid, classid, teacherid } = bodyValidation.data!;

        // Validate subjectid, classid, and teacherid if provided
        if (subjectid) {
            const subject = await prisma.subject.findUnique({ where: { id: subjectid } });
            if (!subject) {
                return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
            }
        }

        if (classid) {
            const classData = await prisma.class.findUnique({ where: { id: classid } });
            if (!classData) {
                return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
            }
        }

        if (teacherid) {
            const teacher = await prisma.teacher.findUnique({ where: { id: teacherid } });
            if (!teacher) {
                return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
            }
        }

        // Check for conflicting lessons if teacherid, day, or time fields are updated
        if (teacherid || day || startTime || endTime) {
            const existingLesson = await prisma.lesson.findFirst({
                where: {
                    teacherid: teacherid || undefined,
                    day: day || undefined,
                    OR: [
                        {
                            AND: [
                                { startTime: { lte: endTime || undefined } },
                                { endTime: { gte: startTime || undefined } }
                            ]
                        }
                    ],
                    id: { not: parseInt(id) }
                }
            });

            if (existingLesson) {
                return NextResponse.json(
                    { error: 'Teacher already has a lesson scheduled at this time' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (day) updateData.day = day;
        if (startTime) updateData.startTime = startTime;
        if (endTime) updateData.endTime = endTime;
        if (subjectid) updateData.subjectid = subjectid;
        if (classid) updateData.classid = classid;
        if (teacherid) updateData.teacherid = teacherid;

        const updatedLesson = await prisma.lesson.update({
            where: { id: parseInt(id) },
            data: updateData,
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

        return successResponse(updatedLesson);
    } catch (error) {
        return handleError(error, 'Failed to update lesson');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.lesson,
            id,
            'Lesson not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.lesson.delete({
            where: { id: parseInt(id) }
        });

        return successResponse({ message: 'Lesson deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete lesson');
    }
}