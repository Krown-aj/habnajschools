import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchNews,
    fetchNewsById,
    createNews,
    updateNews,
    deleteNews,
} from '@/lib/api/news';
import type { News } from '@/types';

/**
 * Fetch all news with optional filters
 */
export const useNews = (filters?: {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    category?: string;
    featured?: boolean;
}) => {
    return useQuery({
        queryKey: ['news', filters],
        queryFn: () => fetchNews(filters),
    });
};

/**
 * Fetch single news article
 */
export const useNewsById = (id: string) => {
    return useQuery({
        queryKey: ['news', id],
        queryFn: () => fetchNewsById(id),
        enabled: !!id,
    });
};

/**
 * Create news article
 */
export const useCreateNews = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<News>) => createNews(data),
        onSuccess: (newNews) => {
            // Invalidate list queries
            queryClient.invalidateQueries({ queryKey: ['news'] });
            // Optionally set to cache
            queryClient.setQueryData(['news', newNews.id], newNews);
        },
    });
};

/**
 * Update news article
 */
export const useUpdateNews = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<News> }) =>
            updateNews(id, data),
        onSuccess: (updatedNews) => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            queryClient.setQueryData(['news', updatedNews.id], updatedNews);
        },
    });
};

/**
 * Delete news article(s)
 */
export const useDeleteNews = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string | string[]) => deleteNews(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });
};