/**
 * Teacher-related client API helpers
 */
import { Teacher as TeacherModel } from '@/generated/prisma';

const DEFAULT_FETCH_OPTIONS: RequestInit = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
};

const parseJsonOrThrow = async (res: Response, fallbackMsg = 'Request failed') => {
    if (res.ok) {
        const json = await res.json().catch(() => null);
        return json;
    }
    const err = await res.json().catch(() => ({ error: fallbackMsg }));
    throw new Error(err?.error || fallbackMsg);
};

/**
 * Fetch teachers with optional filters
 * Supported params: teacherid, section, parentid
 * GET /api/teachers?teacherid=...&section=...&parentid=...
 */
export const fetchTeachers = async (params?: {
    teacherid?: string;
    section?: string;
    parentid?: string;
}): Promise<TeacherModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.teacherid) searchParams.append('teacherid', params.teacherid);
    if (params?.section) searchParams.append('section', params.section);
    if (params?.parentid) searchParams.append('parentid', params.parentid);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/teachers${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch teachers');
    return (json?.data || json) as TeacherModel[];
};

/**
 * Fetch a single teacher by ID
 * GET /api/teachers/:id
 * Returns TeacherModel or null (never undefined)
 */
export const fetchTeacherById = async (id: string) => {
    const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch teacher');
    return json?.data || json;
};

/**
 * Create a new teacher
 * POST /api/teachers
 */
export const createTeacher = async (data: Partial<TeacherModel>): Promise<TeacherModel> => {
    const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create teacher');
    return (json?.data || json) as TeacherModel;
};

/**
 * Update an existing teacher
 * PUT /api/teachers/:id
 */
export const updateTeacher = async (id: string, data: Partial<TeacherModel>): Promise<TeacherModel> => {
    const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update teacher');
    return (json?.data || json) as TeacherModel;
};

/**
 * Delete one or more teachers by ID
 * DELETE /api/teachers?ids=<id>&ids=<id2>
 */
export const deleteTeachers = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/teachers?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete teacher(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
