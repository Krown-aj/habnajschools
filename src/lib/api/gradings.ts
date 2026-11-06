import { Grading as GradingModel } from '@/generated/prisma';

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
 * Fetch gradings with optional filters
 * Supported params: session, term, gradingPolicyId
 * GET /api/gradings?session=...&term=...&gradingPolicyId=...
 */
export const fetchGradings = async (params?: {
    session?: string;
    term?: string;
    gradingPolicyId?: string;
}): Promise<GradingModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.session) searchParams.append('session', params.session);
    if (params?.term) searchParams.append('term', params.term);
    if (params?.gradingPolicyId) searchParams.append('gradingPolicyId', params.gradingPolicyId);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/gradings${query}`, DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch gradings');
    return (json?.data || json) as GradingModel[];
};

/**
 * Fetch a single grading by ID
 * GET /api/gradings/:id
 * Returns GradingModel or null
 */
export const fetchGradingById = async (id: string) => {
    const res = await fetch(`/api/gradings/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch grading');
    return json?.data || json;
};

/**
 * Create a new grading
 * POST /api/gradings
 */
export const createGrading = async (data: Partial<GradingModel>): Promise<GradingModel> => {
    const res = await fetch('/api/gradings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create grading');
    return (json?.data || json) as GradingModel;
};

/**
 * Update an existing grading
 * PUT /api/gradings/:id
 */
export const updateGrading = async (id: string, data: Partial<GradingModel>): Promise<GradingModel> => {
    const res = await fetch(`/api/gradings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update grading');
    return (json?.data || json) as GradingModel;
};

/**
 * Delete one or more gradings by ID
 * DELETE /api/gradings?ids=<id>&ids=<id2>
 */
export const deleteGradings = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/gradings?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete grading(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
