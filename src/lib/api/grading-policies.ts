/**
 * Grading Policy client API helpers
 */
import { GradingPolicy as GradingPolicyModel } from '@/generated/prisma';

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
 * Fetch all grading policies
 * GET /api/policies
 */
export const fetchGradingPolicies = async (): Promise<GradingPolicyModel[]> => {
    const res = await fetch('/api/policies', DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch grading policies');
    return (json?.data || json) as GradingPolicyModel[];
};

/**
 * Fetch single grading policy by ID
 * GET /api/policies/:id
 */
export const fetchGradingPolicyById = async (id: string) => {
    const res = await fetch(`/api/policies/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);
    const json = await parseJsonOrThrow(res, 'Failed to fetch grading policy');
    return json?.data || json;
};

/**
 * Create grading policy
 * POST /api/policies
 */
export const createGradingPolicy = async (data: Partial<GradingPolicyModel>): Promise<GradingPolicyModel> => {
    const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    const json = await parseJsonOrThrow(res, 'Failed to create grading policy');
    return (json?.data || json) as GradingPolicyModel;
};

/**
 * Update grading policy
 * PUT /api/policies/:id
 */
export const updateGradingPolicy = async (id: string, data: Partial<GradingPolicyModel>): Promise<GradingPolicyModel> => {
    const res = await fetch(`/api/policies/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    const json = await parseJsonOrThrow(res, 'Failed to update grading policy');
    return (json?.data || json) as GradingPolicyModel;
};

/**
 * Delete grading policy(s)
 * DELETE /api/policies?ids=<id>&ids=<id2>
 */
export const deleteGradingPolicies = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/policies?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete grading policy(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
