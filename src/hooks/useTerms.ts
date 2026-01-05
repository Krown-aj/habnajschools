import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchTerms,
    fetchTermById,
    createTerm,
    updateTerm,
    deleteTerms,
} from '@/lib/api/terms';
import type { Term as TermType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetTerms = (params?: { status?: string; session?: string }) => {
    return useQuery<TermType[], Error>({
        queryKey: ['terms', params ?? {}],
        queryFn: () => fetchTerms(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetTermById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery<TermType | null, Error>({
        queryKey: ['terms', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchTermById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

/**
 * Snapshot term queries so we can rollback on error
 */
const snapshotTermsQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['terms'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['terms', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateTerm = () => {
    const qc = useQueryClient();
    return useMutation<TermType, Error, Partial<TermType>>({
        mutationFn: (data) => createTerm(data),
        onMutate: async (newTerm) => {
            await qc.cancelQueries({ queryKey: ['terms'] });
            const snapshot = snapshotTermsQueries(qc);

            const optimisticId = (newTerm as any).id ?? `temp-${Date.now()}`;
            const optimisticTerm = { ...(newTerm as TermType), id: optimisticId, status: (newTerm as any).status ?? 'Active' } as TermType;

            // Append optimistic term to every cached terms list
            const listQueries = qc.getQueriesData({ queryKey: ['terms'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) qc.setQueryData(queryKey, [...currentData, optimisticTerm]);
            });

            // Set detail cache
            qc.setQueryData(['terms', 'detail', optimisticId], optimisticTerm);

            // If optimistic status is Active, also mark other cached terms as Inactive
            if (optimisticTerm.status === 'Active') {
                const listQueriesAgain = qc.getQueriesData({ queryKey: ['terms'] });
                listQueriesAgain.forEach(([queryKey, currentData]) => {
                    if (Array.isArray(currentData)) {
                        const patched = currentData.map((t: any) => (t.id === optimisticId ? t : { ...t, status: 'Inactive' }));
                        qc.setQueryData(queryKey, patched);
                    }
                });
            }

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
            qc.invalidateQueries({ queryKey: ['terms'] });
        },
        onSuccess: (created) => {
            if (created?.id) qc.setQueryData(['terms', 'detail', created.id], created);
        },
    });
};

export const useUpdateTerm = () => {
    const qc = useQueryClient();
    return useMutation<TermType, Error, { id: string; data: Partial<TermType> }>({
        mutationFn: ({ id, data }) => updateTerm(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['terms'] });
            const snapshot = snapshotTermsQueries(qc);

            // Patch list caches
            const listQueries = qc.getQueriesData({ queryKey: ['terms'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((t: any) => (t.id === id ? { ...t, ...data } : t));
                    qc.setQueryData(queryKey, patched);
                }
            });

            // Patch detail cache
            const detailKey = ['terms', 'detail', id];
            const currentDetail = qc.getQueryData<TermType | null>(detailKey);
            if (currentDetail) qc.setQueryData(detailKey, { ...currentDetail, ...data });

            // If updating status to Active, mark other cached terms as Inactive
            if ((data as any).status === 'Active') {
                const listQ = qc.getQueriesData({ queryKey: ['terms'] });
                listQ.forEach(([queryKey, currentData]) => {
                    if (Array.isArray(currentData)) {
                        const patched = currentData.map((t: any) => (t.id === id ? { ...t, ...data } : { ...t, status: 'Inactive' }));
                        qc.setQueryData(queryKey, patched);
                    }
                });
            }

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
            qc.invalidateQueries({ queryKey: ['terms'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['terms', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteTerms = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteTerms(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['terms'] });
            const snapshot = snapshotTermsQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            // Remove from caches
            const listQueries = qc.getQueriesData({ queryKey: ['terms'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((t: any) => !idArray.includes(t.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            // Remove detail caches
            idArray.forEach((id) => qc.removeQueries({ queryKey: ['terms', 'detail', id] }));

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
            qc.invalidateQueries({ queryKey: ['terms'] });
        },
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateTerms = () => {
    const qc = useQueryClient();
    return (params?: { status?: string; session?: string }) => {
        qc.invalidateQueries({ queryKey: ['terms', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['terms'] });
        qc.invalidateQueries({ queryKey: ['terms', 'detail'] });
    };
};
