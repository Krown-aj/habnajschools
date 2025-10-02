import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gradingPolicySchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const policies = await prisma.gradingPolicy.findMany({
            include: {
                assessments: {
                    select: {
                        id: true,
                        name: true,
                        weight: true,
                        maxScore: true,
                    },
                },
                traits: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                    },
                },
                _count: {
                    select: {
                        assessments: true,
                        gradings: true,
                        traits: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse({ data: policies });
    } catch (error) {
        return handleError(error, 'Failed to fetch grading policies');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, gradingPolicySchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, description, passMark, maxScore, assessments = [], traits = [] } = bodyValidation.data!;

        const existingPolicy = await prisma.gradingPolicy.findFirst({ where: { title } });
        if (existingPolicy) {
            return NextResponse.json({ error: 'Policy title already exists' }, { status: 409 });
        }

        // validate assessment names uniqueness within payload
        const assessmentNames = assessments.map((a: any) => a.name);
        if (new Set(assessmentNames).size !== assessmentNames.length) {
            return NextResponse.json({ error: 'Assessment names must be unique' }, { status: 400 });
        }

        // validate trait names uniqueness within payload
        const traitNames = traits.map((t: any) => t.name);
        if (new Set(traitNames).size !== traitNames.length) {
            return NextResponse.json({ error: 'Trait names must be unique' }, { status: 400 });
        }

        // create policy first, then bulk create assessments & traits using createMany to reduce round-trips
        const newPolicy = await prisma.gradingPolicy.create({
            data: {
                title,
                description,
                passMark,
                maxScore,
            },
        });

        const createPromises: Array<Promise<any>> = [];

        if (assessments.length > 0) {
            const assessmentsData = assessments.map((a: any) => ({
                name: a.name,
                weight: a.weight,
                maxScore: a.maxScore,
                gradingPolicyId: newPolicy.id,
            }));

            // createMany 
            createPromises.push(
                prisma.assessment.createMany({
                    data: assessmentsData,
                    skipDuplicates: true,
                })
            );
        }

        if (traits.length > 0) {
            const traitsData = traits.map((t: any) => ({
                name: t.name,
                category: t.category,
                gradingpolicyId: newPolicy.id,
            }));

            createPromises.push(
                prisma.trait.createMany({
                    data: traitsData,
                    skipDuplicates: true,
                })
            );
        }

        // run any bulk creates in parallel
        if (createPromises.length > 0) {
            await Promise.all(createPromises);
        }

        // fetch full policy with assessments & traits to return
        const policyWithRelations = await prisma.gradingPolicy.findUnique({
            where: { id: newPolicy.id },
            include: {
                assessments: true,
                traits: true,
            },
        });

        return successResponse(policyWithRelations, 201);
    } catch (error) {
        return handleError(error, 'Failed to create grading policy');
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');

        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Delete assessments and traits that belong to these policies first
        await prisma.assessment.deleteMany({
            where: { gradingPolicyId: { in: ids } },
        });

        // Trait uses gradingpolicyId in your schema
        await prisma.trait.deleteMany({
            where: { gradingpolicyId: { in: ids } },
        });

        const result = await prisma.gradingPolicy.deleteMany({
            where: { id: { in: ids } },
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} grading policies`,
        });
    } catch (error) {
        return handleError(error, 'Failed to delete grading policies');
    }
}
