import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { classUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the class exists
        const resourceCheck = await checkResourceExists(
            prisma.class,
            id,
            'Class record not found.'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.ClassWhereInput = { id };
        if (userRole === UserRole.TEACHER) {
            where.OR = [
                { formmasterid: session!.user.id },
                { lessons: { some: { teacherid: session!.user.id } } }
            ];
        } else if (userRole === UserRole.PARENT) {
            where.students = {
                some: {
                    parentid: session!.user.id
                }
            };
        }

        const classData = await prisma.class.findFirst({
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
                students: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                        admissionnumber: true,
                        gender: true,
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
            }
        });

        if (!classData) {
            return NextResponse.json({ error: 'Access denied or class not found.' }, { status: 403 });
        }

        return successResponse(classData);
    } catch (error) {
        return handleError(error, 'Could not fetch class record.');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.class,
            id,
            'Class record not found.'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, classUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { name, category, capacity, formmasterid } = bodyValidation.data!;

        // Check for name conflicts
        if (name) {
            const existingClass = await prisma.class.findFirst({
                where: { name, id: { not: id } }
            });

            if (existingClass) {
                return NextResponse.json(
                    { error: 'Class name already exists.' },
                    { status: 409 }
                );
            }
        }

        // Validate formmasterid if provided
        if (formmasterid) {
            const formMaster = await prisma.teacher.findUnique({
                where: { id: formmasterid }
            });
            if (!formMaster) {
                return NextResponse.json(
                    { error: 'Class form master is required' },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (category) updateData.category = category;
        if (capacity !== undefined) updateData.capacity = capacity;
        if (formmasterid !== undefined) updateData.formmasterid = formmasterid;

        const updatedClass = await prisma.class.update({
            where: { id },
            data: updateData,
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

        return successResponse(updatedClass);
    } catch (error) {
        return handleError(error, 'Could not update class record.');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.class,
            id,
            'Class not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.class.delete({
            where: { id }
        });

        return successResponse({ message: 'Class record deleted successfully.' });
    } catch (error) {
        return handleError(error, 'Could not delete class record.');
    }
}