import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { subjectSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.SubjectWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            // Teachers see subjects they are assigned to
            where.teachers = {
                some: { id: session!.user.id }
            };
        } else if (userRole === UserRole.PARENT) {
            // Parents see subjects of their children's classes
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

        const subjects = await prisma.subject.findMany({
            where,
            select: {
                id: true,
                name: true,
                category: true,
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
            },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse({ data: subjects });
    } catch (error) {
        return handleError(error, 'Could not fetch subject records');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, subjectSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { name, category, teacherIds } = bodyValidation.data!;

        // Check if subject name already exists
        const existingSubject = await prisma.subject.findFirst({
            where: { name }
        });

        if (existingSubject) {
            return NextResponse.json(
                { error: 'Subject name already exists.' },
                { status: 409 }
            );
        }

        // Validate teacherIds if provided
        if (teacherIds && teacherIds.length > 0) {
            const teachers = await prisma.teacher.findMany({
                where: { id: { in: teacherIds } }
            });
            if (teachers.length !== teacherIds.length) {
                return NextResponse.json(
                    { error: 'One or more invalid teacher IDs.' },
                    { status: 400 }
                );
            }
        }

        const newSubject = await prisma.subject.create({
            data: {
                name,
                category,
                teachers: teacherIds ? { connect: teacherIds.map(id => ({ id })) } : undefined
            },
            select: {
                id: true,
                name: true,
                category: true,
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
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(newSubject, 201);
    } catch (error) {
        return handleError(error, 'Failed to create subject');
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

        const result = await prisma.subject.deleteMany({
            where: { id: { in: ids } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} subjects`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete subjects');
    }
}