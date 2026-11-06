import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getTeacherClasses,
    getTeacherStudents,
    getTeacherSubjects,
} from '@/lib/api/teacher-api-helper';

/**
 * Fetch classes for a teacher
 * GET /api/classes?teacherid=<id>
 */
export const useGetTeacherClasses = (teacherId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['teacher', 'classes', teacherId],
        queryFn: () => {
            if (!teacherId) throw new Error('teacher id is required');
            return getTeacherClasses(teacherId);
        },
        enabled: Boolean(teacherId) && (options?.enabled ?? true),
    });
};

/**
 * Fetch students for a teacher
 * GET /api/students?teacherid=<id>
 */
export const useGetTeacherStudents = (teacherId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['teacher', 'students', teacherId],
        queryFn: () => {
            if (!teacherId) throw new Error('teacher id is required');
            return getTeacherStudents(teacherId);
        },
        enabled: Boolean(teacherId) && (options?.enabled ?? true),
    });
};

/**
 * Fetch subjects for a teacher
 * GET /api/subjects?teacherid=<id>
 */
export const useGetTeacherSubjects = (teacherId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['teacher', 'subjects', teacherId],
        queryFn: () => {
            if (!teacherId) throw new Error('teacher id is required');
            return getTeacherSubjects(teacherId);
        },
        enabled: Boolean(teacherId) && (options?.enabled ?? true),
    });
};

/**
 * Utility hook: invalidate all teacher-related queries
 */
export const useInvalidateTeacher = () => {
    const qc = useQueryClient();
    return (teacherId?: string) => {
        qc.invalidateQueries({ queryKey: ['teacher', 'classes', teacherId] });
        qc.invalidateQueries({ queryKey: ['teacher', 'students', teacherId] });
        qc.invalidateQueries({ queryKey: ['teacher', 'subjects', teacherId] });
        qc.invalidateQueries({ queryKey: ['teacher'] });
    };
};
