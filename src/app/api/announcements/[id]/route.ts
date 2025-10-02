import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { announcementUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

interface RouteParams {
    params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        // Check if the announcement exists
        const resourceCheck = await checkResourceExists(
            prisma.announcement,
            params.id,
            'Announcement not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const announcement = await prisma.announcement.findUnique({
            where: { id: Number(params.id) },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
            }
        });

        if (!announcement) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }

        return successResponse(announcement);
    } catch (error) {
        return handleError(error, 'Failed to fetch announcement');
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.announcement,
            params.id,
            'Announcement not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, announcementUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, description, date } = bodyValidation.data!;

        // Check for title conflicts if title is updated
        if (title) {
            const existingAnnouncement = await prisma.announcement.findFirst({
                where: {
                    title,
                    id: { not: Number(params.id) }
                }
            });

            if (existingAnnouncement) {
                return NextResponse.json(
                    { error: 'Announcement with this title already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (date !== undefined) updateData.date = date;

        const updatedAnnouncement = await prisma.announcement.update({
            where: { id: Number(params.id) },
            data: updateData,
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
            }
        });

        return successResponse(updatedAnnouncement);
    } catch (error) {
        return handleError(error, 'Failed to update announcement');
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.announcement,
            params.id,
            'Announcement not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.announcement.delete({
            where: { id: Number(params.id) }
        });

        return successResponse({ message: 'Announcement deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete announcement');
    }
}