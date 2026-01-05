import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchAdministrations,
    fetchAdministrationById,
    createAdministration,
    updateAdministration,
    deleteAdministrations,
} from '@/lib/api/administrations';
import type { Administration as AdministrationType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetAdministrations = (params?: { adminid?: string; role?: string; active?: string }) => {
    return useQuery<AdministrationType[], Error>({
        queryKey: ['administrations', params ?? {}],
        queryFn: () => fetchAdministrations(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetAdministrationById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery<AdministrationType | null, Error>({
        queryKey: ['administrations', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchAdministrationById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

const snapshotAdministrationsQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['administrations'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['administrations', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateAdministration = () => {
    const qc = useQueryClient();
    return useMutation<AdministrationType, Error, Partial<AdministrationType>>({
        mutationFn: (data) => createAdministration(data),
        onMutate: async (newAdmin) => {
            await qc.cancelQueries({ queryKey: ['administrations'] });
            const snapshot = snapshotAdministrationsQueries(qc);

            const optimisticId = (newAdmin as any).id ?? `temp-${Date.now()}`;
            const optimisticAdmin = { ...(newAdmin as AdministrationType), id: optimisticId } as AdministrationType;

            const listQueries = qc.getQueriesData({ queryKey: ['administrations'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) qc.setQueryData(queryKey, [...currentData, optimisticAdmin]);
            });

            qc.setQueryData(['administrations', 'detail', optimisticId], optimisticAdmin);

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
            qc.invalidateQueries({ queryKey: ['administrations'] });
        },
        onSuccess: (created) => {
            if (created?.id) qc.setQueryData(['administrations', 'detail', created.id], created);
        },
    });
};

export const useUpdateAdministration = () => {
    const qc = useQueryClient();
    return useMutation<AdministrationType, Error, { id: string; data: Partial<AdministrationType> }>({
        mutationFn: ({ id, data }) => updateAdministration(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['administrations'] });
            const snapshot = snapshotAdministrationsQueries(qc);

            const listQueries = qc.getQueriesData({ queryKey: ['administrations'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((a: any) => (a.id === id ? { ...a, ...data } : a));
                    qc.setQueryData(queryKey, patched);
                }
            });

            const detailKey = ['administrations', 'detail', id];
            const currentDetail = qc.getQueryData<AdministrationType | null>(detailKey);
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
            qc.invalidateQueries({ queryKey: ['administrations'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['administrations', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteAdministrations = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteAdministrations(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['administrations'] });
            const snapshot = snapshotAdministrationsQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            const listQueries = qc.getQueriesData({ queryKey: ['administrations'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((a: any) => !idArray.includes(a.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            idArray.forEach(id => qc.removeQueries({ queryKey: ['administrations', 'detail', id] }));

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
            qc.invalidateQueries({ queryKey: ['administrations'] });
        },
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateAdministrations = () => {
    const qc = useQueryClient();
    return (params?: { adminid?: string; role?: string; active?: string }) => {
        qc.invalidateQueries({ queryKey: ['administrations', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['administrations'] });
        qc.invalidateQueries({ queryKey: ['administrations', 'detail'] });
    };
};
