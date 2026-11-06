import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { eventSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const where: Prisma.EventWhereInput = {};

        const events = await prisma.event.findMany({
            where,
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        return successResponse({ data: events });
    } catch (error) {
        return handleError(error, 'Failed to fetch events');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, eventSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, description, startTime, endTime } = bodyValidation.data!;

        // Check if an event with the same title and start time already exists
        const existingEvent = await prisma.event.findFirst({
            where: { title, startTime }
        });

        if (existingEvent) {
            return NextResponse.json(
                { error: 'Event with this title and start time already exists' },
                { status: 409 }
            );
        }

        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                startTime,
                endTime
            },
            select: {
                id: true,
                title: true,
                description: true,
                startTime: true,
                endTime: true,
            }
        });

        return successResponse(newEvent, 201);
    } catch (error) {
        return handleError(error, 'Failed to create event');
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
        const result = await prisma.event.deleteMany({
            where: { id: { in: numberIds } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} events`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete events');
    }
}