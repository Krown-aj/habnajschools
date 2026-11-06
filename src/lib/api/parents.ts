/**
 * Parent-related client API helpers
 */
import { Parent as ParentModel } from '@/generated/prisma';

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
 * Fetch parents with optional filters
 * Supported params: parentid, section, classid
 * GET /api/parents?parentid=...&section=...&classid=...
 */
export const fetchParents = async (params?: {
    parentid?: string;
    section?: string;
    classid?: string;
}): Promise<ParentModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.parentid) searchParams.append('parentid', params.parentid);
    if (params?.section) searchParams.append('section', params.section);
    if (params?.classid) searchParams.append('classid', params.classid);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/parents${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch parents');
    return (json?.data || json) as ParentModel[];
};

/**
 * Fetch single parent by ID
 * GET /api/parents/:id
 * Returns ParentModel or null
 */
export const fetchParentById = async (id: string) => {
    const res = await fetch(`/api/parents/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch parent');
    return json?.data || json;
};

/**
 * Create a new parent
 * POST /api/parents
 */
export const createParent = async (data: Partial<ParentModel>): Promise<ParentModel> => {
    const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create parent');
    return (json?.data || json) as ParentModel;
};

/**
 * Update an existing parent
 * PUT /api/parents/:id
 */
export const updateParent = async (id: string, data: Partial<ParentModel>): Promise<ParentModel> => {
    const res = await fetch(`/api/parents/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update parent');
    return (json?.data || json) as ParentModel;
};

/**
 * Delete one or more parents by ID
 * DELETE /api/parents?ids=<id>&ids=<id2>
 */
export const deleteParents = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/parents?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete parent(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
