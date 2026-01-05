/**
 * Subject-related client API helpers
 */
import { Subject as SubjectModel } from '@/generated/prisma';

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
 * Fetch subjects with optional filters
 * Supported params: teacherid, lessonid, parentid, classid, section
 * GET /api/subjects?teacherid=...&lessonid=...&parentid=...&classid=...&section=...
 */
export const fetchSubjects = async (params?: {
    teacherid?: string;
    lessonid?: string;
    parentid?: string;
    classid?: string;
    section?: string;
}): Promise<SubjectModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.teacherid) searchParams.append('teacherid', params.teacherid);
    if (params?.lessonid) searchParams.append('lessonid', params.lessonid);
    if (params?.parentid) searchParams.append('parentid', params.parentid);
    if (params?.classid) searchParams.append('classid', params.classid);
    if (params?.section) searchParams.append('section', params.section);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/subjects${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch subjects');
    return (json?.data || json) as SubjectModel[];
};

/**
 * Fetch a single subject by ID
 * GET /api/subjects/:id
 * Returns SubjectModel or null (never undefined)
 */
export const fetchSubjectById = async (id: string) => {
    const res = await fetch(`/api/subjects/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch subject');
    return json?.data || json;
};

/**
 * Create a new subject
 * POST /api/subjects
 */
export const createSubject = async (data: Partial<SubjectModel>): Promise<SubjectModel> => {
    const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create subject');
    return (json?.data || json) as SubjectModel;
};

/**
 * Update an existing subject
 * PUT /api/subjects/:id
 */
export const updateSubject = async (id: string, data: Partial<SubjectModel>): Promise<SubjectModel> => {
    const res = await fetch(`/api/subjects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update subject');
    return (json?.data || json) as SubjectModel;
};

/**
 * Delete one or more subjects by ID
 * DELETE /api/subjects?ids=<id>&ids=<id2>
 */
export const deleteSubjects = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/subjects?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete subject(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
