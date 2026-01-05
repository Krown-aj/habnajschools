import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchParents,
    fetchParentById,
    createParent,
    updateParent,
    deleteParents,
} from '@/lib/api/parents';
import { Parent as ParentType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetParents = (params?: { parentid?: string; section?: string; classid?: string }) => {
    return useQuery<ParentType[], Error>({
        queryKey: ['parents', params ?? {}],
        queryFn: () => fetchParents(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetParentById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery({
        queryKey: ['parents', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchParentById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

const snapshotParentsQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['parents'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['parents', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateParent = () => {
    const qc = useQueryClient();
    return useMutation<ParentType, Error, Partial<ParentType>>({
        mutationFn: (data) => createParent(data),
        onMutate: async (newParent) => {
            await qc.cancelQueries({ queryKey: ['parents'] });
            const snapshot = snapshotParentsQueries(qc);

            const optimisticId = (newParent as any).id ?? `temp-${Date.now()}`;
            const optimisticParent = { ...(newParent as ParentType), id: optimisticId } as ParentType;

            const listQueries = qc.getQueriesData({ queryKey: ['parents'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) qc.setQueryData(queryKey, [...currentData, optimisticParent]);
            });

            qc.setQueryData(['parents', 'detail', optimisticId], optimisticParent);

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
            qc.invalidateQueries({ queryKey: ['parents'] });
        },
        onSuccess: (created) => {
            if (created?.id) qc.setQueryData(['parents', 'detail', created.id], created);
        },
    });
};

export const useUpdateParent = () => {
    const qc = useQueryClient();
    return useMutation<ParentType, Error, { id: string; data: Partial<ParentType> }>({
        mutationFn: ({ id, data }) => updateParent(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['parents'] });
            const snapshot = snapshotParentsQueries(qc);

            const listQueries = qc.getQueriesData({ queryKey: ['parents'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((p: any) => (p.id === id ? { ...p, ...data } : p));
                    qc.setQueryData(queryKey, patched);
                }
            });

            const detailKey = ['parents', 'detail', id];
            const currentDetail = qc.getQueryData<ParentType | null>(detailKey);
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
            qc.invalidateQueries({ queryKey: ['parents'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['parents', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteParents = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteParents(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['parents'] });
            const snapshot = snapshotParentsQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            const listQueries = qc.getQueriesData({ queryKey: ['parents'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((p: any) => !idArray.includes(p.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            idArray.forEach(id => qc.removeQueries({ queryKey: ['parents', 'detail', id] }));

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
            qc.invalidateQueries({ queryKey: ['parents'] });
        },
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateParents = () => {
    const qc = useQueryClient();
    return (params?: { parentid?: string; section?: string; classid?: string }) => {
        qc.invalidateQueries({ queryKey: ['parents', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['parents'] });
        qc.invalidateQueries({ queryKey: ['parents', 'detail'] });
    };
};
