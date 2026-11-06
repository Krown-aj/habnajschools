import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchTeachers,
    fetchTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeachers,
} from '@/lib/api/teachers';
import { Teacher as TeacherType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetTeachers = (params?: { teacherid?: string; section?: string; parentid?: string }) => {
    return useQuery<TeacherType[], Error>({
        queryKey: ['teachers', params ?? {}],
        queryFn: () => fetchTeachers(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetTeacherById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery({
        queryKey: ['teachers', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchTeacherById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

/**
 * Helper: snapshot all teacher-list queries and detail queries so we can rollback if needed.
 * Returns an object with snapshots keyed by queryKey (stringified).
 */
const snapshotTeachersQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['teachers'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['teachers', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateTeacher = () => {
    const qc = useQueryClient();
    return useMutation<TeacherType, Error, Partial<TeacherType>>({
        mutationFn: (data) => createTeacher(data),
        // optimistic update
        onMutate: async (newTeacher) => {
            await qc.cancelQueries({ queryKey: ['teachers'] });
            const snapshot = snapshotTeachersQueries(qc);

            // Update every teacher-list cache by appending the optimistic item
            const optimisticTeacher = { ...(newTeacher as TeacherType), id: (newTeacher as any).id ?? `temp-${Date.now()}` } as TeacherType;

            const listQueries = qc.getQueriesData({ queryKey: ['teachers'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    qc.setQueryData(queryKey, [...currentData, optimisticTeacher]);
                }
            });

            // set detail cache if an id exists
            if (optimisticTeacher.id) {
                qc.setQueryData(['teachers', 'detail', optimisticTeacher.id], optimisticTeacher);
            }

            return { snapshot };
        },
        onError: (err, _variables, context: any) => {
            // rollback
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['teachers'] });
        },
        onSuccess: (created) => {
            // ensure detail cache matches server response
            if (created?.id) qc.setQueryData(['teachers', 'detail', created.id], created);
        },
    });
};

export const useUpdateTeacher = () => {
    const qc = useQueryClient();
    return useMutation<TeacherType, Error, { id: string; data: Partial<TeacherType> }>({
        mutationFn: ({ id, data }) => updateTeacher(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['teachers'] });
            const snapshot = snapshotTeachersQueries(qc);

            // Patch list caches: map and replace matching id
            const listQueries = qc.getQueriesData({ queryKey: ['teachers'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((t: any) => (t.id === id ? { ...t, ...data } : t));
                    qc.setQueryData(queryKey, patched);
                }
            });

            // Patch detail cache
            const detailKey = ['teachers', 'detail', id];
            const currentDetail = qc.getQueryData<TeacherType | null>(detailKey);
            if (currentDetail) qc.setQueryData(detailKey, { ...currentDetail, ...data });

            return { snapshot };
        },
        onError: (err, _variables, context: any) => {
            // rollback
            const { snapshot } = context || {};
            if (snapshot) {
                snapshot.listSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
                snapshot.detailSnapshots?.forEach(({ key, data }: any) => qc.setQueryData(key, data));
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['teachers'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['teachers', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteTeachers = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteTeachers(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['teachers'] });
            const snapshot = snapshotTeachersQueries(qc);

            const idArray = Array.isArray(ids) ? ids : [ids];

            // Remove from cached lists
            const listQueries = qc.getQueriesData({ queryKey: ['teachers'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((t: any) => !idArray.includes(t.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            // Remove detail caches
            idArray.forEach(id => qc.removeQueries({ queryKey: ['teachers', 'detail', id] }));

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
            qc.invalidateQueries({ queryKey: ['teachers'] });
        },
    });
};


/* -------------------- Utilities -------------------- */

export const useInvalidateTeachers = () => {
    const qc = useQueryClient();
    return (params?: { teacherid?: string; section?: string; parentid?: string }) => {
        qc.invalidateQueries({ queryKey: ['teachers', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['teachers'] });
        qc.invalidateQueries({ queryKey: ['teachers', 'detail'] });
    };
};
