import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { newsSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import { Prisma } from '@/generated/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([
            UserRole.SUPER,
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
            UserRole.TEACHER,
            UserRole.PARENT,
            UserRole.STUDENT
        ]);
        if (validation.error) return validation.error;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');

        const where: Prisma.NewsWhereInput = {};

        if (status) where.status = status as any;
        if (category) where.category = category as any;
        if (featured !== null) where.featured = featured === 'true';

        const news = await prisma.news.findMany({
            where,
            select: {
                id: true,
                title: true,
                excerpt: true,
                author: true,
                category: true,
                status: true,
                featured: true,
                image: true,
                readTime: true,
                publishedAt: true,
                createdAt: true,
            },
            orderBy: { publishedAt: 'desc' }
        });

        return successResponse({ data: news });
    } catch (error) {
        return handleError(error, 'Failed to fetch news');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, newsSchema);
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

        // Prevent duplicate title + publishedAt (if published)
        if (status === 'PUBLISHED' && publishedAt) {
            const existing = await prisma.news.findFirst({
                where: {
                    title,
                    publishedAt: new Date(publishedAt),
                    status: 'PUBLISHED'
                }
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'A published news article with this title and date already exists' },
                    { status: 409 }
                );
            }
        }

        const newNews = await prisma.news.create({
            data: {
                title,
                content,
                excerpt,
                author,
                category,
                status: status || 'DRAFT',
                featured: featured || false,
                image,
                readTime,
                publishedAt: publishedAt ? new Date(publishedAt) : null
            },
            select: {
                id: true,
                title: true,
                excerpt: true,
                author: true,
                category: true,
                status: true,
                featured: true,
                image: true,
                readTime: true,
                publishedAt: true,
                createdAt: true,
            }
        });

        return successResponse(newNews, 201);
    } catch (error) {
        return handleError(error, 'Failed to create news');
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const { searchParams } = new URL(request.url);
        const ids = searchParams.getAll('ids');

        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const result = await prisma.news.deleteMany({
            where: { id: { in: ids } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} news articles`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete news');
    }
}