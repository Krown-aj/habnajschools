import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gradingUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.grading,
            id,
            'Grading not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const grading = await prisma.grading.findUnique({
            where: { id },
            include: {
                gradingPolicy: {
                    select: {
                        id: true,
                        title: true,
                        passMark: true,
                        maxScore: true,
                    },
                },
                studentAssessments: {
                    select: {
                        id: true,
                        student: true,
                        subject: true,
                        assessment: true,
                        class: true,
                        gradingId: true,
                        score: true,
                    }
                },
                studentGrades: {
                    select: {
                        id: true,
                        score: true,
                        grade: true,
                        remark: true,
                        subjectPosition: true,
                        assessments: true,
                        student: true,
                        class: true,
                        subject: true,
                        gradingId: true,
                    }
                },
                studentTraits: {
                    select: {
                        id: true,
                        score: true,
                        trait: true,
                        student: true,
                        gradingId: true
                    }
                },
                _count: {
                    select: {
                        reportCards: true,
                        studentGrades: true,
                    },
                },
            },
        });

        return successResponse(grading);
    } catch (error) {
        return handleError(error, 'Failed to fetch grading');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.grading,
            id,
            'Grading not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, gradingUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const data = bodyValidation.data!;
        const { title, session, term, published, gradingPolicyId } = data;

        if (gradingPolicyId && session && term) {
            const existing = await prisma.grading.findFirst({
                where: {
                    id: { not: id },
                    gradingPolicyId,
                    session,
                    term,
                },
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Grading already exists for the given session and term' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (session !== undefined) updateData.session = session;
        if (term !== undefined) updateData.term = term;
        if (published !== undefined) updateData.published = published;
        if (gradingPolicyId !== undefined) updateData.gradingPolicyId = gradingPolicyId;

        const updatedGrading = await prisma.grading.update({
            where: { id },
            data: updateData,
            include: {
                gradingPolicy: {
                    select: {
                        id: true,
                        title: true,
                        passMark: true,
                        maxScore: true,
                    },
                },
            },
        });

        return successResponse(updatedGrading);
    } catch (error) {
        return handleError(error, 'Failed to update grading');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.grading,
            id,
            'Grading not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.studentGrade.deleteMany({
            where: { gradingId: id },
        });

        await prisma.reportCard.deleteMany({
            where: { gradingId: id },
        });

        await prisma.grading.delete({
            where: { id },
        });

        return successResponse({ message: 'Grading deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete grading');
    }
}