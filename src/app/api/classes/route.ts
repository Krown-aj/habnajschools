import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { classSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Validate session
        const validation = await validateSession();
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const teacherParam = url.searchParams.get('teacherid');
        const parentParam = url.searchParams.get('parentid');
        const sectionParam = url.searchParams.get('section');

        const whereClauses: Prisma.ClassWhereInput[] = [];

        if (teacherParam) {
            // get teacher's section
            const teacherRecord = await prisma.teacher.findUnique({
                where: { id: teacherParam },
                select: { section: true }
            });

            const orConditions: Prisma.ClassWhereInput[] = [
                { formmasterid: teacherParam },
                { lessons: { some: { teacherid: teacherParam } } }
            ];

            if (teacherRecord?.section) {
                orConditions.push({ section: teacherRecord.section });
            }

            whereClauses.push({ OR: orConditions });
        }

        if (parentParam) {
            // Classes that have students whose parentid matches
            whereClauses.push({
                students: {
                    some: {
                        parentid: parentParam
                    }
                }
            });
        }

        if (sectionParam) {
            whereClauses.push({ section: sectionParam.toLocaleUpperCase() });
        }

        const where: Prisma.ClassWhereInput = whereClauses.length ? { AND: whereClauses } : {};

        const classes = await prisma.class.findMany({
            where,
            select: {
                id: true,
                name: true,
                category: true,
                capacity: true,
                section: true,
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
            orderBy: { name: 'asc' }
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

        const { name, category, capacity, section, formmasterid } = bodyValidation.data!;

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
                section,
                formmasterid
            },
            select: {
                id: true,
                name: true,
                category: true,
                capacity: true,
                section: true,
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
