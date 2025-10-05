// src/app/api/administrations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { administrationUpdateSchema } from '@/lib/schemas/index';
import {
    validateSession,
    validateRequestBody,
    handleError,
    successResponse,
    checkResourceExists,
    UserRole
} from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Only super admin can view any administrator, others can only view their own data
        if (userRole !== UserRole.SUPER && id !== session!.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const resourceCheck = await checkResourceExists(prisma.administration, id, 'Administrator not found');
        if (resourceCheck.error) return resourceCheck.error;

        const administrator = await prisma.administration.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { notifications: true } }
            }
        });

        return successResponse(administrator);
    } catch (error) {
        return handleError(error, 'Failed to fetch administrator');
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        if (userRole !== UserRole.SUPER && id !== session!.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const resourceCheck = await checkResourceExists(prisma.administration, id, 'Administrator not found');
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, administrationUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { email, password, role, active } = bodyValidation.data!;

        // Check for email conflicts
        if (email) {
            const existingUser = await prisma.administration.findFirst({
                where: { email, id: { not: id } }
            });

            if (existingUser) {
                return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
            }
        }

        // Non-super users cannot change their own role
        if (userRole !== UserRole.SUPER && role && id === session!.user.id) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
        }

        const updateData: Record<string, any> = {};
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (active !== undefined) updateData.active = active;
        if (password) updateData.password = await bcrypt.hash(password, 12);

        const updatedAdmin = await prisma.administration.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(updatedAdmin);
    } catch (error) {
        return handleError(error, 'Failed to update administrator');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const { session } = validation;

        // Prevent deletion of current user
        if (id === session!.user.id) {
            return NextResponse.json(
                { error: 'Invalid operation - You cannot delete your own account!' },
                { status: 400 }
            );
        }

        const resourceCheck = await checkResourceExists(prisma.administration, id, 'Administrator not found');
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.administration.delete({ where: { id } });

        return successResponse({ message: 'Administrator deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete administrator');
    }
}
