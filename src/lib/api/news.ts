import type { News } from '@/types';

/**
 * Fetch all news articles with optional filters
 */
export const fetchNews = async (params?: {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    category?: string;
    featured?: boolean;
}): Promise<News[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.featured !== undefined) searchParams.append('featured', String(params.featured));

    const res = await fetch(`/api/news?${searchParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch news' }));
        throw new Error(err.error || 'Failed to fetch news');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Fetch a single news article by ID
 */
export const fetchNewsById = async (id: string): Promise<News> => {
    const res = await fetch(`/api/news/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch news article' }));
        throw new Error(err.error || 'Failed to fetch news article');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Create a new news article
 */
export const createNews = async (data: Partial<News>): Promise<News> => {
    const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create news article' }));
        throw new Error(err.error || 'Failed to create news article');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Update an existing news article
 */
export const updateNews = async (id: string, data: Partial<News>): Promise<News> => {
    const res = await fetch(`/api/news/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update news article' }));
        throw new Error(err.error || 'Failed to update news article');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Delete one or more news articles by ID
 */
export const deleteNews = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/news?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete news article(s)' }));
        throw new Error(err.error || 'Failed to delete news article(s)');
    }

    const json = await res.json();
    return json.data;
};