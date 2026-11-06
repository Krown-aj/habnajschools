import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        // Check if the event exists
        const resourceCheck = await checkResourceExists(
            prisma.event,
            id,
            'Event not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Since Event has no direct relations, all authorized users can see all events
        const event = await prisma.event.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                title: true,
                description: true,
                startTime: true,
                endTime: true,
            }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return successResponse(event);
    } catch (error) {
        return handleError(error, 'Failed to fetch event');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.event,
            id,
            'Event not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, eventUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, description, startTime, endTime } = bodyValidation.data!;

        // Check for event conflicts if title or startTime is updated
        if (title || startTime) {
            const existingEvent = await prisma.event.findFirst({
                where: {
                    title: title || undefined,
                    startTime: startTime || undefined,
                    id: { not: Number(id) }
                }
            });

            if (existingEvent) {
                return NextResponse.json(
                    { error: 'Event with this name and start date already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (startTime) updateData.startTime = startTime;
        if (endTime) updateData.endTime = endTime;

        const updatedEvent = await prisma.event.update({
            where: { id: Number(id) },
            data: updateData,
            select: {
                id: true,
                title: true,
                description: true,
                startTime: true,
                endTime: true,
            }
        });

        return successResponse(updatedEvent);
    } catch (error) {
        return handleError(error, 'Failed to update event');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.event,
            id,
            'Event not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.event.delete({
            where: { id: Number(id) }
        });

        return successResponse({ message: 'Event deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete event');
    }
}