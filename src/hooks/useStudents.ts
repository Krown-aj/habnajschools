import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchStudents,
    fetchStudentById,
    createStudent,
    updateStudent,
    deleteStudents,
} from '@/lib/api/students';
import { Student as StudentType } from '@/generated/prisma';

const DEFAULT_STALE_MS = 1000 * 60 * 2; // 2 minutes

export const useGetStudents = (params?: {
    classid?: string;
    section?: string;
    parentid?: string;
    teacherid?: string;
}) => {
    return useQuery<StudentType[], Error>({
        queryKey: ['students', params ?? {}],
        queryFn: () => fetchStudents(params),
        staleTime: DEFAULT_STALE_MS,
    });
};

export const useGetStudentById = (id?: string, options?: { enabled?: boolean; staleTime?: number }) => {
    return useQuery<StudentType | null, Error>({
        queryKey: ['students', 'detail', id ?? ''],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchStudentById(id);
            return data ?? null;
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? DEFAULT_STALE_MS,
    });
};

/* -------------------- Optimistic Mutations -------------------- */

const snapshotStudentsQueries = (qc: ReturnType<typeof useQueryClient>) => {
    const listSnapshots = qc.getQueriesData({ queryKey: ['students'] }).map(([key, data]) => ({ key, data }));
    const detailSnapshots = qc.getQueriesData({ queryKey: ['students', 'detail'] }).map(([key, data]) => ({ key, data }));
    return { listSnapshots, detailSnapshots };
};

export const useCreateStudent = () => {
    const qc = useQueryClient();
    return useMutation<StudentType, Error, Partial<StudentType>>({
        mutationFn: (data) => createStudent(data),
        onMutate: async (newStudent) => {
            await qc.cancelQueries({ queryKey: ['students'] });
            const snapshot = snapshotStudentsQueries(qc);

            const optimisticId = (newStudent as any).id ?? `temp-${Date.now()}`;
            const optimisticStudent = { ...(newStudent as StudentType), id: optimisticId } as StudentType;

            const listQueries = qc.getQueriesData({ queryKey: ['students'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) qc.setQueryData(queryKey, [...currentData, optimisticStudent]);
            });

            qc.setQueryData(['students', 'detail', optimisticId], optimisticStudent);

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
            qc.invalidateQueries({ queryKey: ['students'] });
        },
        onSuccess: (created) => {
            if (created?.id) qc.setQueryData(['students', 'detail', created.id], created);
        },
    });
};

export const useUpdateStudent = () => {
    const qc = useQueryClient();
    return useMutation<StudentType, Error, { id: string; data: Partial<StudentType> }>({
        mutationFn: ({ id, data }) => updateStudent(id, data),
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ['students'] });
            const snapshot = snapshotStudentsQueries(qc);

            const listQueries = qc.getQueriesData({ queryKey: ['students'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const patched = currentData.map((s: any) => (s.id === id ? { ...s, ...data } : s));
                    qc.setQueryData(queryKey, patched);
                }
            });

            const detailKey = ['students', 'detail', id];
            const currentDetail = qc.getQueryData<StudentType | null>(detailKey);
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
            qc.invalidateQueries({ queryKey: ['students'] });
        },
        onSuccess: (updated) => {
            if (updated?.id) qc.setQueryData(['students', 'detail', updated.id], updated);
        },
    });
};

export const useDeleteStudents = () => {
    const qc = useQueryClient();
    return useMutation<{ deleted: number; message: string }, Error, string | string[]>({
        mutationFn: (ids) => deleteStudents(ids),
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey: ['students'] });
            const snapshot = snapshotStudentsQueries(qc);
            const idArray = Array.isArray(ids) ? ids : [ids];

            const listQueries = qc.getQueriesData({ queryKey: ['students'] });
            listQueries.forEach(([queryKey, currentData]) => {
                if (Array.isArray(currentData)) {
                    const filtered = currentData.filter((s: any) => !idArray.includes(s.id));
                    qc.setQueryData(queryKey, filtered);
                }
            });

            idArray.forEach(id => qc.removeQueries({ queryKey: ['students', 'detail', id] }));

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
            qc.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

/* -------------------- Utilities -------------------- */

export const useInvalidateStudents = () => {
    const qc = useQueryClient();
    return (params?: { classid?: string; section?: string; parentid?: string; teacherid?: string }) => {
        qc.invalidateQueries({ queryKey: ['students', params ?? {}] });
        qc.invalidateQueries({ queryKey: ['students'] });
        qc.invalidateQueries({ queryKey: ['students', 'detail'] });
    };
};
