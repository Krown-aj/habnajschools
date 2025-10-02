import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gradingSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import { Terms } from '@/generated/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const { searchParams } = new URL(request.url);
        const session = searchParams.get('session');
        const term = searchParams.get('term');
        const gradingPolicyId = searchParams.get('gradingPolicyId');

        const where: any = {};
        if (session) where.session = session;
        if (term && Object.values(Terms).includes(term as Terms)) where.term = term;
        if (gradingPolicyId) where.gradingPolicyId = gradingPolicyId;

        const gradings = await prisma.grading.findMany({
            where,
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
            orderBy: { createdAt: 'desc' },
        });

        return successResponse({ data: gradings });
    } catch (error) {
        return handleError(error, 'Failed to fetch gradings');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, gradingSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, session, term, gradingPolicyId, published } = bodyValidation.data!;

        const existingGrading = await prisma.grading.findUnique({
            where: {
                unique_policy_session_term: {
                    gradingPolicyId,
                    session,
                    term,
                },
            },
        });

        if (existingGrading) {
            return NextResponse.json(
                { error: 'Grading already exists for the selected session and term' },
                { status: 409 }
            );
        }

        const newGrading = await prisma.grading.create({
            data: {
                title,
                session,
                term,
                published,
                gradingPolicyId,
            },
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

        return successResponse(newGrading, 201);
    } catch (error) {
        return handleError(error, 'Failed to create grading');
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

        await prisma.studentGrade.deleteMany({
            where: { gradingId: { in: ids } },
        });

        await prisma.reportCard.deleteMany({
            where: { gradingId: { in: ids } },
        });

        const result = await prisma.grading.deleteMany({
            where: { id: { in: ids } },
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} gradings`,
        });
    } catch (error) {
        return handleError(error, 'Failed to delete gradings');
    }
}