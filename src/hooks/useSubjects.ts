import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchSubjects,
    fetchSubjectById,
    createSubject,
    updateSubject,
    deleteSubjects,
} from '@/lib/api/subjects';
import type { Subject as SubjectType } from '@/types';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetSubjects = (params?: {
    teacherid?: string;
    lessonid?: string;
    parentid?: string;
    classid?: string;
    section?: string;
}) => {
    return useQuery<SubjectType[], Error>({
        queryKey: ['subjects', params ?? {}],
        queryFn: () => fetchSubjects(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetSubjectById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery({
        queryKey: ['subjects', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchSubjectById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

/**
 * Snapshot all subject-list queries and detail queries so we can rollback if needed.
 */
const snapshotSubjectsQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['subjects'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['subjects', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateSubject = () => {
    const qc = useQueryClient();
    return useMutation<SubjectType, Error, Partial<SubjectType>>({
        mutationFn: (data) => createSubject(data),
        onMutate: async (newSubject) => {
            await qc.cancelQueries({ queryKey: ['subjects'] });
            const snapshot = snapshotSubjectsQueries(qc);

            // optimistic id if server doesn't provide one immediately
            const optimisticId = (newSubject as any).id ?? `temp-${Date.now()}`;
            const optimisticSubject = { ...(newSubject as SubjectType), id: optimisticId } as SubjectType;

            // append optimisticSubject to all cached subjects lists
            const listQueries = qc.getQueriesData({ queryKey: ['subjects'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    qc.setQueryData(queryKey, [...currentData, optimisticSubject]);
                }
            });

            // set detail cache for optimistic id
            qc.setQueryData(['subjects', 'detail', optimisticId], optimisticSubject);

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
            qc.invalidateQueries({ queryKey: ['subjects'] });
        },
        onSuccess: (created) => {
            // ensure detail cache matches server response
            if (created?.id) qc.setQueryData(['subjects', 'detail', created.id], created);
        },
    });
};

export const useUpdateSubject = () => {
    const qc = useQueryClient();
    return useMutation<SubjectType, Error, { id: string; data: Partial<SubjectType> }>({
        mutationFn: ({ id, data }) => updateSubject(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['subjects'] });
            const snapshot = snapshotSubjectsQueries(qc);

            // Patch all list caches by id
            const listQueries = qc.getQueriesData({ queryKey: ['subjects'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((s: any) => (s.id === id ? { ...s, ...data } : s));
                    qc.setQueryData(queryKey, patched);
                }
            });

            // Patch detail cache
            const detailKey = ['subjects', 'detail', id];
            const currentDetail = qc.getQueryData<SubjectType | null>(detailKey);
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
            qc.invalidateQueries({ queryKey: ['subjects'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['subjects', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteSubjects = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteSubjects(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['subjects'] });
            const snapshot = snapshotSubjectsQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            // Remove from cached lists
            const listQueries = qc.getQueriesData({ queryKey: ['subjects'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((s: any) => !idArray.includes(s.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            // Remove detail caches for removed ids
            idArray.forEach(id => qc.removeQueries({ queryKey: ['subjects', 'detail', id] }));

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
            qc.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateSubjects = () => {
    const qc = useQueryClient();
    return (params?: {
        teacherid?: string;
        lessonid?: string;
        parentid?: string;
        classid?: string;
        section?: string;
    }) => {
        qc.invalidateQueries({ queryKey: ['subjects', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['subjects'] });
        qc.invalidateQueries({ queryKey: ['subjects', 'detail'] });
    };
};
