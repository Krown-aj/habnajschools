/**
 * Lesson-related client API helpers
 */
import type { Lesson } from '@/types';

export const fetchLessonsByClass = async (classId: string): Promise<Lesson[]> => {
    const res = await fetch(`/api/lessons?classid=${encodeURIComponent(classId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch lessons' }));
        throw new Error(err.error || 'Failed to fetch lessons');
    }

    const json = await res.json();
    return json.data;
};

export const createLesson = async (data: any) => {
    const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create lesson' }));
        throw new Error(err.error || 'Failed to create lesson');
    }

    const json = await res.json();
    return json.data;
};
