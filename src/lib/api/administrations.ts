/**
 * Administration-related client API helpers
 */
import { Administration as AdministrationModel } from '@/generated/prisma';

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
 * Fetch administrations with optional filters
 * Supported params: adminid, role, active
 * GET /api/administrations?adminid=...&role=...&active=...
 */
export const fetchAdministrations = async (params?: {
    adminid?: string;
    role?: string;
    active?: string; // 'true' | 'false'
}): Promise<AdministrationModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.adminid) searchParams.append('adminid', params.adminid);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.active !== undefined) searchParams.append('active', params.active);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/administrations${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch administrations');
    return (json?.data || json) as AdministrationModel[];
};

/**
 * Fetch a single administration by ID
 * GET /api/administrations/:id
 * Returns AdministrationModel or null (never undefined)
 */
export const fetchAdministrationById = async (id: string) => {
    const res = await fetch(`/api/administrations/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch administration');
    return json?.data || json;
};

/**
 * Create a new administration user
 * POST /api/administrations
 */
export const createAdministration = async (data: Partial<AdministrationModel>): Promise<AdministrationModel> => {
    const res = await fetch('/api/administrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create administration');
    return (json?.data || json) as AdministrationModel;
};

/**
 * Update an existing administration
 * PUT /api/administrations/:id
 */
export const updateAdministration = async (id: string, data: Partial<AdministrationModel>): Promise<AdministrationModel> => {
    const res = await fetch(`/api/administrations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update administration');
    return (json?.data || json) as AdministrationModel;
};

/**
 * Delete one or more administration users by ID
 * DELETE /api/administrations?ids=<id>&ids=<id2>
 */
export const deleteAdministrations = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/administrations?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete administration(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
