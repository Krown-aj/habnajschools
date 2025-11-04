import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { newsUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([
            UserRole.SUPER,
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
            UserRole.TEACHER,
            UserRole.PARENT,
            UserRole.STUDENT
        ]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(prisma.news, id, 'News article not found');
        if (resourceCheck.error) return resourceCheck.error;

        const news = await prisma.news.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                content: true,
                excerpt: true,
                author: true,
                category: true,
                status: true,
                featured: true,
                image: true,
                readTime: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!news) {
            return NextResponse.json({ error: 'News article not found' }, { status: 404 });
        }

        return successResponse(news);
    } catch (error) {
        return handleError(error, 'Failed to fetch news article');
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(prisma.news, id, 'News article not found');
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, newsUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const {
            title,
            content,
            excerpt,
            author,
            category,
            status,
            featured,
            image,
            readTime,
            publishedAt
        } = bodyValidation.data!;

        // Conflict check if title + publishedAt is changing and status is PUBLISHED
        if ((title || publishedAt || status) && status !== 'DRAFT') {
            const checkDate = publishedAt ? new Date(publishedAt) : undefined;
            const existing = await prisma.news.findFirst({
                where: {
                    title: title || undefined,
                    publishedAt: checkDate
                        ? { equals: checkDate }
                        : undefined,
                    status: status === 'PUBLISHED' ? 'PUBLISHED' : undefined,
                    id: { not: id }
                }
            });

            if (existing) {
                return NextResponse.json(
                    { error: 'Another published article with this title and date already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (author) updateData.author = author;
        if (category) updateData.category = category;
        if (status) updateData.status = status;
        if (featured !== undefined) updateData.featured = featured;
        if (image !== undefined) updateData.image = image;
        if (readTime !== undefined) updateData.readTime = readTime;
        if (publishedAt !== undefined) {
            updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
        }

        const updatedNews = await prisma.news.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                title: true,
                content: true,
                excerpt: true,
                author: true,
                category: true,
                status: true,
                featured: true,
                image: true,
                readTime: true,
                publishedAt: true,
                updatedAt: true,
            }
        });

        return successResponse(updatedNews);
    } catch (error) {
        return handleError(error, 'Failed to update news article');
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(prisma.news, id, 'News article not found');
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.news.delete({
            where: { id }
        });

        return successResponse({ message: 'News article deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete news article');
    }
}