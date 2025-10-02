import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { classSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.ClassWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            // Teachers see classes where they are form masters or have lessons
            where.OR = [
                { formmasterid: session!.user.id },
                { lessons: { some: { teacherid: session!.user.id } } }
            ];
        } else if (userRole === UserRole.PARENT) {
            // Parents see classes of their children
            where.students = {
                some: {
                    parentid: session!.user.id
                }
            };
        }

        const classes = await prisma.class.findMany({
            where,
            select: {
                id: true,
                name: true,
                category: true,
                capacity: true,
                formmasterid: true,
                formmaster: {
                    select: {
                        id: true,
                        title: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                    }
                },
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        students: true,
                        lessons: true,
                        assignments: true,
                        tests: true
                    }
                }
            },
            orderBy: { name: 'asc', }
        });

        return successResponse({ data: classes });
    } catch (error) {
        return handleError(error, 'Failed to fetch classes');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, classSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { name, category, capacity, formmasterid } = bodyValidation.data!;

        // Check if class name already exists
        const existingClass = await prisma.class.findUnique({
            where: { name }
        });

        if (existingClass) {
            return NextResponse.json(
                { error: 'Class name already exists.' },
                { status: 409 }
            );
        }

        // Validate formmasterid if provided
        if (formmasterid) {
            const formMaster = await prisma.teacher.findUnique({
                where: { id: formmasterid }
            });
            if (!formMaster) {
                return NextResponse.json(
                    { error: 'Class form master is required.' },
                    { status: 400 }
                );
            }
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                category,
                capacity,
                formmasterid
            },
            select: {
                id: true,
                name: true,
                category: true,
                capacity: true,
                formmasterid: true,
                formmaster: {
                    select: {
                        id: true,
                        title: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(newClass, 201);
    } catch (error) {
        return handleError(error, 'Could not create class.');
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');

        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided.' }, { status: 400 });
        }

        const result = await prisma.class.deleteMany({
            where: { id: { in: ids } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} classes.`
        });
    } catch (error) {
        return handleError(error, 'Could not delete selected classes.');
    }
}