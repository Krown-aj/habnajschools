/**
 * Parent-related client API helpers
 */
import { Student, Class as SchoolClass, Subject } from '@/generated/prisma';

/**
 * Fetch children (students) for a parent
 * GET /api/students?parentid=<id>
 */
export const getParentStudents = async (parentId: string): Promise<Student[]> => {
    const res = await fetch(`/api/students?parentid=${encodeURIComponent(parentId)}`, {
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
 * Fetch classes of parent's children
 * GET /api/classes?parentid=<id>
 */
export const getParentClasses = async (parentId: string): Promise<SchoolClass[]> => {
    const res = await fetch(`/api/classes?parentid=${encodeURIComponent(parentId)}`, {
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
 * Fetch subjects for parent's children
 * GET /api/subjects?parentid=<id>
 */
export const getParentSubjects = async (parentId: string): Promise<Subject[]> => {
    const res = await fetch(`/api/subjects?parentid=${encodeURIComponent(parentId)}`, {
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
