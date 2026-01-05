/**
 * Teacher-related client API helpers
 */
import { Student, Subject, Class as SchoolClass } from '@/generated/prisma';

/**
 * Fetch classes for a teacher
 * GET /api/classes?teacherid=<id>
 */
export const getTeacherClasses = async (teacherId: string): Promise<SchoolClass[]> => {
    const res = await fetch(`/api/classes?teacherid=${encodeURIComponent(teacherId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch classes' }));
        throw new Error(err.error || 'Failed to fetch classes');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Fetch students for a teacher
 * GET /api/students?teacherid=<id>
 */
export const getTeacherStudents = async (teacherId: string): Promise<Student[]> => {
    const res = await fetch(`/api/students?teacherid=${encodeURIComponent(teacherId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch students' }));
        throw new Error(err.error || 'Failed to fetch students');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Fetch subjects for a teacher
 * GET /api/subjects?teacherid=<id>
 */
export const getTeacherSubjects = async (teacherId: string): Promise<Subject[]> => {
    const res = await fetch(`/api/subjects?teacherid=${encodeURIComponent(teacherId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch subjects' }));
        throw new Error(err.error || 'Failed to fetch subjects');
    }

    const json = await res.json();
    return json.data;
};
