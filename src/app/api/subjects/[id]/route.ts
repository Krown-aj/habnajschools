import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { subjectUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the subject exists
        const resourceCheck = await checkResourceExists(
            prisma.subject,
            id,
            'Subject not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.SubjectWhereInput = { id };
        if (userRole === UserRole.TEACHER) {
            where.teachers = {
                some: { id: session!.user.id }
            };
        } else if (userRole === UserRole.PARENT) {
            where.lessons = {
                some: {
                    class: {
                        students: {
                            some: { parentid: session!.user.id }
                        }
                    }
                }
            };
        }

        const subject = await prisma.subject.findFirst({
            where,
            select: {
                id: true,
                name: true,
                teachers: {
                    select: {
                        id: true,
                        title: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                        gender: true,
                    }
                },
                category: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        teachers: true,
                        assignments: true,
                        lessons: true,
                        tests: true
                    }
                }
            }
        });

        if (!subject) {
            return NextResponse.json({ error: 'Access denied or subject not found' }, { status: 403 });
        }

        return successResponse(subject);
    } catch (error) {
        return handleError(error, 'Failed to fetch subject');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.subject,
            id,
            'Subject not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, subjectUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { name, category, teacherIds } = bodyValidation.data!;

        // Check for name conflicts
        if (name) {
            const existingSubject = await prisma.subject.findFirst({
                where: { name, id: { not: id } }
            });

            if (existingSubject) {
                return NextResponse.json(
                    { error: 'Subject name already exists' },
                    { status: 409 }
                );
            }
        }

        // Validate teacherIds if provided
        if (teacherIds && teacherIds.length > 0) {
            const teachers = await prisma.teacher.findMany({
                where: { id: { in: teacherIds } }
            });
            if (teachers.length !== teacherIds.length) {
                return NextResponse.json(
                    { error: 'One or more invalid teacher IDs' },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (category) updateData.category = category;
        if (teacherIds !== undefined) {
            updateData.teachers = {
                set: teacherIds.map(id => ({ id }))
            };
        }

        const updatedSubject = await prisma.subject.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                name: true,
                teachers: {
                    select: {
                        id: true,
                        title: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                        gender: true,
                    }
                },
                category: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(updatedSubject);
    } catch (error) {
        return handleError(error, 'Failed to update subject');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.subject,
            id,
            'Subject not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.subject.delete({
            where: { id }
        });

        return successResponse({ message: 'Subject deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete subject');
    }
}