import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchGradings,
    fetchGradingById,
    createGrading,
    updateGrading,
    deleteGradings,
} from '@/lib/api/gradings';
import type { Grading as GradingType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetGradings = (params?: { session?: string; term?: string; gradingPolicyId?: string }) => {
    return useQuery<GradingType[], Error>({
        queryKey: ['gradings', params ?? {}],
        queryFn: () => fetchGradings(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetGradingById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery({
        queryKey: ['gradings', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchGradingById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

const snapshotGradingsQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['gradings'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['gradings', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateGrading = () => {
    const qc = useQueryClient();
    return useMutation<GradingType, Error, Partial<GradingType>>({
        mutationFn: (data) => createGrading(data),
        onMutate: async (newGrading) => {
            await qc.cancelQueries({ queryKey: ['gradings'] });
            const snapshot = snapshotGradingsQueries(qc);

            const optimisticId = (newGrading as any).id ?? `temp-${Date.now()}`;
            const optimisticGrading = { ...(newGrading as GradingType), id: optimisticId } as GradingType;

            const listQueries = qc.getQueriesData({ queryKey: ['gradings'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) qc.setQueryData(queryKey, [...currentData, optimisticGrading]);
            });

            qc.setQueryData(['gradings', 'detail', optimisticId], optimisticGrading);

            return { snapshot, optimisticId };
        },
        onError: (_err, _variables, context: any) => {
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['gradings'] });
        },
        onSuccess: (created) => {
            if (created?.id) qc.setQueryData(['gradings', 'detail', created.id], created);
        },
    });
};

export const useUpdateGrading = () => {
    const qc = useQueryClient();
    return useMutation<GradingType, Error, { id: string; data: Partial<GradingType> }>({
        mutationFn: ({ id, data }) => updateGrading(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['gradings'] });
            const snapshot = snapshotGradingsQueries(qc);

            const listQueries = qc.getQueriesData({ queryKey: ['gradings'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((g: any) => (g.id === id ? { ...g, ...data } : g));
                    qc.setQueryData(queryKey, patched);
                }
            });

            const detailKey = ['gradings', 'detail', id];
            const currentDetail = qc.getQueryData<GradingType | null>(detailKey);
            if (currentDetail) qc.setQueryData(detailKey, { ...currentDetail, ...data });

            return { snapshot };
        },
        onError: (_err, _variables, context: any) => {
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['gradings'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['gradings', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteGradings = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteGradings(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['gradings'] });
            const snapshot = snapshotGradingsQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            const listQueries = qc.getQueriesData({ queryKey: ['gradings'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((g: any) => !idArray.includes(g.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            idArray.forEach(id => qc.removeQueries({ queryKey: ['gradings', 'detail', id] }));

            return { snapshot, removedIds: idArray };
        },
        onError: (_err, _variables, context: any) => {
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['gradings'] });
        },
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateGradings = () => {
    const qc = useQueryClient();
    return (params?: { session?: string; term?: string; gradingPolicyId?: string }) => {
        qc.invalidateQueries({ queryKey: ['gradings', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['gradings'] });
        qc.invalidateQueries({ queryKey: ['gradings', 'detail'] });
    };
};
