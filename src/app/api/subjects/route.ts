import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { subjectSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

/**
 * GET /api/subjects
 *
 * Query params supported:
 * - section=<SECTION>     -> subjects that have lessons in classes whose section === SECTION
 * - teacherid=<ID>        -> subjects assigned to the teacher (teachers relation)
 * - parentid=<ID>         -> subjects that appear in lessons for classes that contain children of the parent
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // ensure requester is authenticated
        const validation = await validateSession();
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const teacherParam = url.searchParams.get('teacherid');
        const parentParam = url.searchParams.get('parentid');
        const sectionParam = url.searchParams.get('section');

        const whereClauses: Prisma.SubjectWhereInput[] = [];

        // teacher filter: subjects assigned to a given teacher
        if (teacherParam) {
            whereClauses.push({
                teachers: { some: { id: teacherParam } },
            });
        }

        // parent filter: subjects that are taught in classes where the parent's children are enrolled
        if (parentParam) {
            whereClauses.push({
                lessons: {
                    some: {
                        class: {
                            students: {
                                some: { parentid: parentParam },
                            },
                        },
                    },
                },
            });
        }

        // section filter: subjects that have lessons in classes matching the section
        if (sectionParam) {
            whereClauses.push({
                lessons: {
                    some: {
                        class: {
                            section: sectionParam.toLocaleUpperCase(),
                        },
                    },
                },
            });
        }

        const where: Prisma.SubjectWhereInput = whereClauses.length > 0 ? { AND: whereClauses } : {};

        const subjects = await prisma.subject.findMany({
            where,
            select: {
                id: true,
                name: true,
                category: true,
                section: true,
                teachers: {
                    select: {
                        id: true,
                        title: true,
                        firstname: true,
                        surname: true,
                    },
                },
                _count: {
                    select: {
                        teachers: true,
                        assignments: true,
                        lessons: true,
                        tests: true,
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
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

        const { name, category, teacherIds, section } = bodyValidation.data!;

        // Check if subject name already exists
        const existingSubject = await prisma.subject.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                },
                section: {
                    equals: section,
                    mode: 'insensitive'
                }
            },
        });

        if (existingSubject) {
            return NextResponse.json({ error: 'Subject name already exists.' }, { status: 409 });
        }

        // Validate teacherIds if provided
        if (teacherIds && teacherIds.length > 0) {
            const teachers = await prisma.teacher.findMany({
                where: { id: { in: teacherIds } },
                select: { id: true },
            });
            if (teachers.length !== teacherIds.length) {
                return NextResponse.json({ error: 'One or more invalid teacher IDs.' }, { status: 400 });
            }
        }

        const newSubject = await prisma.subject.create({
            data: {
                name,
                category,
                section,
                teachers: teacherIds ? { connect: teacherIds.map(id => ({ id })) } : undefined,
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
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
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
            where: { id: { in: ids } },
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} subjects`,
        });
    } catch (error) {
        return handleError(error, 'Failed to delete subjects');
    }
}
