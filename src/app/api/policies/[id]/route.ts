import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gradingPolicyUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.gradingPolicy,
            id,
            'Grading policy not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const policy = await prisma.gradingPolicy.findUnique({
            where: { id },
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
        });

        return successResponse(policy);
    } catch (error) {
        return handleError(error, 'Failed to fetch grading policy');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.gradingPolicy,
            id,
            'Grading policy not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, gradingPolicyUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const data = bodyValidation.data!;
        const {
            title,
            description,
            passMark,
            maxScore,
            assessments = [],
            deleteAssessments = [],
            traits = [],
            deleteTraits = [],
        } = data;

        if (title) {
            const existing = await prisma.gradingPolicy.findFirst({
                where: { title, id: { not: id } },
            });
            if (existing) {
                return NextResponse.json({ error: 'Policy title already exists' }, { status: 409 });
            }
        }

        // Validate assessment names uniqueness within payload
        const assessmentNames = assessments.map((a: any) => a.name);
        if (new Set(assessmentNames).size !== assessmentNames.length) {
            return NextResponse.json({ error: 'Assessment names must be unique' }, { status: 400 });
        }

        // Validate trait names uniqueness within payload
        const traitNames = traits.map((t: any) => t.name);
        if (new Set(traitNames).size !== traitNames.length) {
            return NextResponse.json({ error: 'Trait names must be unique' }, { status: 400 });
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (passMark !== undefined) updateData.passMark = passMark;
        if (maxScore !== undefined) updateData.maxScore = maxScore;

        // Run an interactive transaction with longer timeout
        const updatedPolicy = await prisma.$transaction(
            async (tx) => {
                // delete requested assessments and traits first
                if (deleteAssessments.length > 0) {
                    await tx.assessment.deleteMany({
                        where: {
                            id: { in: deleteAssessments },
                            gradingPolicyId: id,
                        },
                    });
                }

                if (deleteTraits.length > 0) {
                    await tx.trait.deleteMany({
                        where: {
                            id: { in: deleteTraits },
                            gradingpolicyId: id,
                        },
                    });
                }

                // Separate new vs update for assessments
                const newAssessments = assessments.filter((a: any) => !a.id);
                const updateAssessments = assessments.filter((a: any) => !!a.id);

                // Bulk create new assessments
                if (newAssessments.length > 0) {
                    const assessmentsData = newAssessments.map((a: any) => ({
                        name: a.name,
                        weight: a.weight,
                        maxScore: a.maxScore,
                        gradingPolicyId: id,
                    }));
                    await tx.assessment.createMany({
                        data: assessmentsData,
                        skipDuplicates: true,
                    });
                }

                // Parallel updates for existing assessments
                if (updateAssessments.length > 0) {
                    await Promise.all(
                        updateAssessments.map((ass: any) =>
                            tx.assessment.update({
                                where: { id: ass.id },
                                data: {
                                    name: ass.name,
                                    weight: ass.weight,
                                    maxScore: ass.maxScore,
                                },
                            })
                        )
                    );
                }

                // Separate new vs update for traits
                const newTraits = traits.filter((t: any) => !t.id);
                const updateTraits = traits.filter((t: any) => !!t.id);

                // Bulk create new traits
                if (newTraits.length > 0) {
                    const traitsData = newTraits.map((t: any) => ({
                        name: t.name,
                        category: t.category,
                        gradingpolicyId: id,
                    }));
                    await tx.trait.createMany({
                        data: traitsData,
                        skipDuplicates: true,
                    });
                }

                // Parallel updates for existing traits
                if (updateTraits.length > 0) {
                    await Promise.all(
                        updateTraits.map((t: any) =>
                            tx.trait.update({
                                where: { id: t.id },
                                data: {
                                    name: t.name,
                                    category: t.category,
                                },
                            })
                        )
                    );
                }

                // finally update the grading policy meta and return the policy with relations
                return tx.gradingPolicy.update({
                    where: { id },
                    data: updateData,
                    include: {
                        assessments: true,
                        traits: true,
                    },
                });
            },
            { timeout: 30000 } // 30s timeout for interactive transaction
        );

        return successResponse(updatedPolicy);
    } catch (error) {
        return handleError(error, 'Failed to update grading policy');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.gradingPolicy,
            id,
            'Grading policy not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Delete assessments and traits for this policy first
        await prisma.assessment.deleteMany({
            where: { gradingPolicyId: id },
        });

        await prisma.trait.deleteMany({
            where: { gradingpolicyId: id },
        });

        await prisma.gradingPolicy.delete({
            where: { id },
        });

        return successResponse({ message: 'Grading policy deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete grading policy');
    }
}
