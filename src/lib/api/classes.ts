/**
 * Class-related client API helpers
 */
import { Class as SchoolClass } from '@/generated/prisma';

const DEFAULT_FETCH_OPTIONS: RequestInit = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
};

const parseJsonOrThrow = async (res: Response, fallbackMsg = 'Request failed') => {
    if (res.ok) {
        // If body is empty, return null
        const json = await res.json().catch(() => null);
        return json;
    }
    const err = await res.json().catch(() => ({ error: fallbackMsg }));
    throw new Error(err?.error || fallbackMsg);
};

/**
 * Fetch classes with optional filters
 * Supported params: teacherid, parentid, section
 * GET /api/classes?teacherid=...&parentid=...&section=...
 */
export const fetchClasses = async (params?: {
    teacherid?: string;
    parentid?: string;
    section?: string;
}): Promise<SchoolClass[]> => {
    const searchParams = new URLSearchParams();
    if (params?.teacherid) searchParams.append('teacherid', params.teacherid);
    if (params?.parentid) searchParams.append('parentid', params.parentid);
    if (params?.section) searchParams.append('section', params.section);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/classes${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch classes');
    return (json.data || json) as SchoolClass[];
};

/**
 * Fetch a single class by ID
 * GET /api/classes/:id
 * Returns SchoolClass or null (never undefined)
 */
export const fetchClassById = async (id: string) => {
    const res = await fetch(`/api/classes/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch class');
    // Normalize to null if API returned no data
    return json.data || json;
};

/**
 * Create a new class
 * POST /api/classes
 */
export const createClass = async (data: Partial<SchoolClass>): Promise<SchoolClass> => {
    const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create class');
    return json.data || json as SchoolClass;
};

/**
 * Update an existing class
 * PUT /api/classes/:id
 */
export const updateClass = async (id: string, data: Partial<SchoolClass>): Promise<SchoolClass> => {
    const res = await fetch(`/api/classes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update class');
    return json.data || json as SchoolClass;
};

/**
 * Delete one or more classes by ID
 * DELETE /api/classes?ids=<id>&ids=<id2>
 */
export const deleteClasses = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/classes?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete class(es)');
    return json.data || json as { deleted: number; message: string };
};
