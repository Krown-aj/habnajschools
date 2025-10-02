import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { administrationSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const { userRole } = validation;

        const where: Prisma.AdministrationWhereInput = {};

        // Only super admin can see all administrators
        if (userRole !== UserRole.SUPER) {
            // Return only current user's data
            where.id = validation.session!.user.id;
        }

        const administrators = await prisma.administration.findMany({
            where,
            select: {
                id: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { notifications: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse({ data: administrators });
    } catch (error) {
        return handleError(error, 'Failed to fetch administrators');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, administrationSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { email, password, role, active } = bodyValidation.data!;

        // Check if email already exists
        const existingUser = await prisma.administration.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

        const newAdmin = await prisma.administration.create({
            data: {
                email,
                password: hashedPassword,
                role,
                active
            },
            select: {
                id: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(newAdmin, 201);
    } catch (error) {
        return handleError(error, 'Failed to create administrator.');
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

        // Prevent deletion of current user
        const currentUserId = validation.session!.user.id;
        const safeIds = ids.filter(id => id !== currentUserId);

        if (safeIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid operation - you cannot delete your own account.' },
                { status: 400 }
            );
        }

        const result = await prisma.administration.deleteMany({
            where: { id: { in: safeIds } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} admistrative users.`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete admistrative users.');
    }
}