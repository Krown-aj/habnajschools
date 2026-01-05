import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClasses,
} from '@/lib/api/classes';
import type { Class as SchoolClass } from '@/types';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetClasses = (params?: { teacherid?: string; parentid?: string; section?: string }) => {
    return useQuery<SchoolClass[], Error>({
        queryKey: ['classes', params ?? {}],
        queryFn: () => fetchClasses(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetClassById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery({
        queryKey: ['classes', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchClassById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

export const useCreateClass = () => {
    const qc = useQueryClient();
    return useMutation<SchoolClass, Error, Partial<SchoolClass>>({
        mutationFn: (data) => createClass(data),
        onSuccess: (newClass) => {
            qc.invalidateQueries({ queryKey: ['classes'] });
            if (newClass?.id) qc.setQueryData(['classes', 'detail', newClass.id], newClass);
        },
    });
};

export const useUpdateClass = () => {
    const qc = useQueryClient();
    return useMutation<SchoolClass, Error, { id: string; data: Partial<SchoolClass> }>({
        mutationFn: ({ id, data }) => updateClass(id, data),
        onSuccess: (updatedClass) => {
            qc.invalidateQueries({ queryKey: ['classes'] });
            if (updatedClass?.id) qc.setQueryData(['classes', 'detail', updatedClass.id], updatedClass);
        },
    });
};

export const useDeleteClasses = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteClasses(ids),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['classes'] });
        },
    });
};

export const useInvalidateClasses = () => {
    const qc = useQueryClient();
    return (params?: { teacherid?: string; parentid?: string; section?: string }) => {
        qc.invalidateQueries({ queryKey: ['classes', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['classes'] });
        qc.invalidateQueries({ queryKey: ['classes', 'detail'] });
    };
};
