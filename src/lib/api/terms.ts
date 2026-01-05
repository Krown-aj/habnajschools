/**
 * Term-related client API helpers
 */
import { Term as TermModel } from '@/generated/prisma';

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
 * Fetch terms (optional filters could be added if needed)
 * GET /api/terms
 */
export const fetchTerms = async (params?: { status?: string; session?: string }): Promise<TermModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.session) searchParams.append('session', params.session);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/terms${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch terms');
    return (json?.data || json) as TermModel[];
};

/**
 * Fetch single term by id
 * GET /api/terms/:id
 */
export const fetchTermById = async (id: string) => {
    const res = await fetch(`/api/terms/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch term');
    return json?.data || json;
};

/**
 * Create a new term
 * POST /api/terms
 */
export const createTerm = async (data: Partial<TermModel>): Promise<TermModel> => {
    const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create term');
    return (json?.data || json) as TermModel;
};

/**
 * Update an existing term
 * PUT /api/terms/:id
 * (backend must support this route; kept for parity)
 */
export const updateTerm = async (id: string, data: Partial<TermModel>): Promise<TermModel> => {
    const res = await fetch(`/api/terms/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update term');
    return (json?.data || json) as TermModel;
};

/**
 * Delete one or more terms
 * DELETE /api/terms?ids=<id>&ids=<id2>
 */
export const deleteTerms = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach((id) => searchParams.append('ids', id));

    const res = await fetch(`/api/terms?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete term(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
