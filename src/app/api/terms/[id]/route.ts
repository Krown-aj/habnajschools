import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Terms } from '@/generated/prisma';
import { termUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        // Check if the term exists
        const resourceCheck = await checkResourceExists(
            prisma.term,
            id,
            'Term not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const term = await prisma.term.findUnique({
            where: { id },
            select: {
                id: true,
                start: true,
                end: true,
                nextterm: true,
                daysopen: true,
                session: true,
                term: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!term) {
            return NextResponse.json({ error: 'Term not found' }, { status: 404 });
        }

        return successResponse(term);
    } catch (error) {
        return handleError(error, 'Failed to fetch term');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.term,
            id,
            'Term not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, termUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { start, end, nextterm, daysopen, session, term, status } = bodyValidation.data!;

        // Check for term conflicts in the same session
        if (session || term) {
            const existingTerm = await prisma.term.findFirst({
                where: {
                    session: session || undefined,
                    term: term || undefined,
                    id: { not: id }
                }
            });

            if (existingTerm) {
                return NextResponse.json(
                    { error: 'Term already exists for this session' },
                    { status: 409 }
                );
            }
        }

        // Handle status updates
        if (status) {
            if (status === 'Active') {
                // Set all other terms to Inactive
                await prisma.term.updateMany({
                    where: { id: { not: id }, status: 'Active' },
                    data: { status: 'Inactive' }
                });
            } else if (status === 'Inactive') {
                // Find the immediate next term to set as Active
                let nextTermToActivate = null;
                const currentTerm = await prisma.term.findUnique({
                    where: { id },
                    select: { nextterm: true, session: true, term: true }
                });

                if (currentTerm?.nextterm) {
                    // Find term with start date matching nextterm
                    nextTermToActivate = await prisma.term.findFirst({
                        where: { start: currentTerm.nextterm },
                        select: { id: true }
                    });
                }

                // If no nextterm match, fallback to the next term in session/term order
                if (!nextTermToActivate && currentTerm) {
                    const allTerms = ['First', 'Second', 'Third'];
                    const currentTermIndex = allTerms.indexOf(currentTerm.term);
                    const nextTermName = allTerms[currentTermIndex + 1];
                    if (nextTermName) {
                        nextTermToActivate = await prisma.term.findFirst({
                            where: { session: currentTerm.session, term: nextTermName as Terms },
                            select: { id: true }
                        });
                    }
                }

                // Set the next term to Active if found
                if (nextTermToActivate) {
                    await prisma.term.updateMany({
                        where: { status: 'Active' },
                        data: { status: 'Inactive' }
                    });
                    await prisma.term.update({
                        where: { id: nextTermToActivate.id },
                        data: { status: 'Active' }
                    });
                }
            }
        }

        const updateData: any = {};
        if (start) updateData.start = start;
        if (end) updateData.end = end;
        if (nextterm) updateData.nextterm = nextterm;
        if (daysopen !== undefined) updateData.daysopen = daysopen;
        if (session) updateData.session = session;
        if (term) updateData.term = term;
        if (status) updateData.status = status;

        const updatedTerm = await prisma.term.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                start: true,
                end: true,
                nextterm: true,
                daysopen: true,
                session: true,
                term: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(updatedTerm);
    } catch (error) {
        return handleError(error, 'Failed to update term');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.term,
            id,
            'Term not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Find the term to be deleted to check its nextterm
        const termToDelete = await prisma.term.findUnique({
            where: { id },
            select: { id: true, nextterm: true, session: true, term: true }
        });

        // Delete the term
        await prisma.term.delete({
            where: { id }
        });

        // Find the next term to set as Active
        let nextTermToActivate = null;
        if (termToDelete?.nextterm) {
            // Find term with start date matching nextterm
            nextTermToActivate = await prisma.term.findFirst({
                where: { start: termToDelete.nextterm },
                select: { id: true }
            });
        }

        // If no nextterm match, fallback to the next term in session/term order
        if (!nextTermToActivate && termToDelete) {
            const allTerms = ['First', 'Second', 'Third'];
            const currentTermIndex = allTerms.indexOf(termToDelete.term);
            const nextTermName = allTerms[currentTermIndex + 1];
            if (nextTermName) {
                nextTermToActivate = await prisma.term.findFirst({
                    where: { session: termToDelete.session, term: nextTermName as Terms },
                    select: { id: true }
                });
            }
        }

        // Set the next term to Active if found
        if (nextTermToActivate) {
            await prisma.term.updateMany({
                where: { status: 'Active' },
                data: { status: 'Inactive' }
            });
            await prisma.term.update({
                where: { id: nextTermToActivate.id },
                data: { status: 'Active' }
            });
        }

        return successResponse({ message: 'Term deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete term');
    }
}