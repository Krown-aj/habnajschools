import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getParentStudents,
    getParentClasses,
    getParentSubjects,
} from '@/lib/api/parent-api-helper';

/**
 * Fetch students for a parent
 * GET /api/students?parentid=<id>
 */
export const useGetParentStudents = (parentId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['parent', 'students', parentId],
        queryFn: () => {
            if (!parentId) throw new Error('parent id is required');
            return getParentStudents(parentId);
        },
        enabled: Boolean(parentId) && (options?.enabled ?? true),
    });
};

/**
 * Fetch classes for a parent
 * GET /api/classes?parentid=<id>
 */
export const useGetParentClasses = (parentId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['parent', 'classes', parentId],
        queryFn: () => {
            if (!parentId) throw new Error('parent id is required');
            return getParentClasses(parentId);
        },
        enabled: Boolean(parentId) && (options?.enabled ?? true),
    });
};

/**
 * Fetch subjects for a parent
 * GET /api/subjects?parentid=<id>
 */
export const useGetParentSubjects = (parentId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['parent', 'subjects', parentId],
        queryFn: () => {
            if (!parentId) throw new Error('parent id is required');
            return getParentSubjects(parentId);
        },
        enabled: Boolean(parentId) && (options?.enabled ?? true),
    });
};

/**
 * Utility hook: invalidate all parent-related queries
 */
export const useInvalidateParent = () => {
    const qc = useQueryClient();
    return (parentId?: string) => {
        qc.invalidateQueries({ queryKey: ['parent', 'students', parentId] });
        qc.invalidateQueries({ queryKey: ['parent', 'classes', parentId] });
        qc.invalidateQueries({ queryKey: ['parent', 'subjects', parentId] });
        qc.invalidateQueries({ queryKey: ['parent'] });
    };
};
