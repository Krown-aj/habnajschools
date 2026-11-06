import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { announcementSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const where: Prisma.AnnouncementWhereInput = {};

        const announcements = await prisma.announcement.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return successResponse({ data: announcements });
    } catch (error) {
        return handleError(error, 'Failed to fetch announcements');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, announcementSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, description, date } = bodyValidation.data!;

        // Check if an announcement with the same title already exists
        const existingAnnouncement = await prisma.announcement.findFirst({
            where: { title }
        });

        if (existingAnnouncement) {
            return NextResponse.json(
                { error: 'Announcement with this title already exists' },
                { status: 409 }
            );
        }

        const newAnnouncement = await prisma.announcement.create({
            data: {
                title,
                description,
                date
            },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
            }
        });

        return successResponse(newAnnouncement, 201);
    } catch (error) {
        return handleError(error, 'Failed to create announcement');
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

        const numberIds = ids.map(id => Number(id)).filter(id => !isNaN(id));

        const result = await prisma.announcement.deleteMany({
            where: { id: { in: numberIds } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} announcements`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete announcements');
    }
}