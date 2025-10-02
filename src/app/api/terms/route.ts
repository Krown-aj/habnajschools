import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { Terms } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { termSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const where: Prisma.TermWhereInput = {};

        const terms = await prisma.term.findMany({
            where,
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
            },
            orderBy: { status: 'asc' }
        });

        return successResponse({ data: terms });
    } catch (error) {
        return handleError(error, 'Failed to fetch terms');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, termSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { start, end, nextterm, daysopen, session, term, } = bodyValidation.data!;

        // Calculate days open if not provided
        const startDate = new Date(start);
        const endDate = new Date(end);
        const opendays = daysopen || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if term already exists for the session and term
        const existingTerm = await prisma.term.findFirst({
            where: { session, term }
        });

        if (existingTerm) {
            return NextResponse.json(
                { error: 'Term already exists for this session' },
                { status: 409 }
            );
        }

        // Set all existing terms to Inactive
        await prisma.term.updateMany({
            where: { status: 'Active' },
            data: { status: 'Inactive' }
        });

        // Create new term with Active status
        const newTerm = await prisma.term.create({
            data: {
                start,
                end,
                nextterm,
                daysopen: opendays,
                session,
                term,
                status: 'Active'
            },
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

        return successResponse(newTerm, 201);
    } catch (error) {
        return handleError(error, 'Failed to create term');
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

        // Find terms to be deleted to check their nextterm
        const termsToDelete = await prisma.term.findMany({
            where: { id: { in: ids } },
            select: { id: true, nextterm: true, session: true, term: true }
        });

        // Delete the specified terms
        const result = await prisma.term.deleteMany({
            where: { id: { in: ids } }
        });

        // Find the next term to set as Active
        let nextTermToActivate = null;
        for (const deletedTerm of termsToDelete) {
            if (deletedTerm.nextterm) {
                // Find term with start date matching nextterm
                nextTermToActivate = await prisma.term.findFirst({
                    where: { start: deletedTerm.nextterm },
                    select: { id: true }
                });
                if (nextTermToActivate) break;
            }
        }

        // If no nextterm match, fallback to the next term in session/term order
        if (!nextTermToActivate && termsToDelete.length > 0) {
            const deletedSession = termsToDelete[0].session;
            const deletedTerms = termsToDelete.map(t => t.term);
            const allTerms = ['First', 'Second', 'Third'];
            const nextTermName = allTerms.find(t => !deletedTerms.includes(t as Terms));
            if (nextTermName) {
                nextTermToActivate = await prisma.term.findFirst({
                    where: { session: deletedSession, term: nextTermName as Terms },
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

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} terms`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete terms');
    }
}