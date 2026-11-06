/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
    data: T;
    error?: string;
}

import type { Class as ClassType, Subject, Teacher } from '@/types';

export const fetchClasses = async (): Promise<ClassType[]> => {
    try {
        const res = await fetch('/api/classes', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch classes' }));
            throw new Error(err.error || 'Failed to fetch classes');
        }

        const json: ApiResponse<ClassType[]> = await res.json();
        console.log("Fetched classes: ", json.data);
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to fetch classes');
    }
};

export const fetchSubjects = async (): Promise<Subject[]> => {
    try {
        const res = await fetch('/api/subjects', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch subjects' }));
            throw new Error(err.error || 'Failed to fetch subjects');
        }

        const json: ApiResponse<Subject[]> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to fetch subjects');
    }
};

export const fetchTeachers = async (): Promise<Teacher[]> => {
    try {
        const res = await fetch('/api/teachers', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch teachers' }));
            throw new Error(err.error || 'Failed to fetch teachers');
        }

        const json: ApiResponse<Teacher[]> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to fetch teachers');
    }
};
