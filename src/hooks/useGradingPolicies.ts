/**
 * React Query hooks for grading policies
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchGradingPolicies,
    fetchGradingPolicyById,
    createGradingPolicy,
    updateGradingPolicy,
    deleteGradingPolicies,
} from '@/lib/api/grading-policies';
import type { GradingPolicy as GradingPolicyType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2;

export const useGetGradingPolicies = () =>
    useQuery<GradingPolicyType[], Error>({
        queryKey: ['gradingPolicies'],
        queryFn: fetchGradingPolicies,
        staleTime: DEFAULT_STALE_MS,
    });

export const useGetGradingPolicyById = (id?: string, options?: { enabled?: boolean }) =>
    useQuery({
        queryKey: ['gradingPolicies', 'detail', id ?? ''],
        queryFn: async () => (id ? fetchGradingPolicyById(id) : null),
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: DEFAULT_STALE_MS,
    });

/* -------------------- Optimistic Mutations -------------------- */

const snapshotGradingPoliciesQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['gradingPolicies'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['gradingPolicies', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateGradingPolicy = () => {
    const qc = useQueryClient();
    return useMutation<GradingPolicyType, Error, Partial<GradingPolicyType>>({
        mutationFn: createGradingPolicy,
        onMutate: async (newPolicy) => {
            await qc.cancelQueries({ queryKey: ['gradingPolicies'] });
            const snapshot = snapshotGradingPoliciesQueries(qc);

            const optimisticId = (newPolicy as any).id ?? `temp-${Date.now()}`;
            const optimisticPolicy = { ...(newPolicy as GradingPolicyType), id: optimisticId } as GradingPolicyType;

            const listQueries = qc.getQueriesData({ queryKey: ['gradingPolicies'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) qc.setQueryData(queryKey, [...currentData, optimisticPolicy]);
            });

            qc.setQueryData(['gradingPolicies', 'detail', optimisticId], optimisticPolicy);

            return { snapshot, optimisticId };
        },
        onError: (_err, _variables, context: any) => {
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ['gradingPolicies'] }),
        onSuccess: (created) => {
            if (created?.id) qc.setQueryData(['gradingPolicies', 'detail', created.id], created);
        },
    });
};

export const useUpdateGradingPolicy = () => {
    const qc = useQueryClient();
    return useMutation<GradingPolicyType, Error, { id: string; data: Partial<GradingPolicyType> }>({
        mutationFn: ({ id, data }) => updateGradingPolicy(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['gradingPolicies'] });
            const snapshot = snapshotGradingPoliciesQueries(qc);

            const listQueries = qc.getQueriesData({ queryKey: ['gradingPolicies'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((p: any) => (p.id === id ? { ...p, ...data } : p));
                    qc.setQueryData(queryKey, patched);
                }
            });

            const detailKey = ['gradingPolicies', 'detail', id];
            const currentDetail = qc.getQueryData<GradingPolicyType | null>(detailKey);
            if (currentDetail) qc.setQueryData(detailKey, { ...currentDetail, ...data });

            return { snapshot };
        },
        onError: (_err, _variables, context: any) => {
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ['gradingPolicies'] }),
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['gradingPolicies', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteGradingPolicies = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: deleteGradingPolicies,
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['gradingPolicies'] });
            const snapshot = snapshotGradingPoliciesQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            const listQueries = qc.getQueriesData({ queryKey: ['gradingPolicies'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((p: any) => !idArray.includes(p.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            idArray.forEach(id => qc.removeQueries({ queryKey: ['gradingPolicies', 'detail', id] }));

            return { snapshot, removedIds: idArray };
        },
        onError: (_err, _variables, context: any) => {
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ['gradingPolicies'] }),
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateGradingPolicies = () => {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ['gradingPolicies'] });
        qc.invalidateQueries({ queryKey: ['gradingPolicies', 'detail'] });
    };
};
