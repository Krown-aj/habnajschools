/**
 * Student-related client API helpers
 */
import { Student as StudentModel } from '@/generated/prisma';

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
 * Fetch students with optional filters
 * Supported params: classid, section, parentid, teacherid
 * GET /api/students?classid=...&section=...&parentid=...&teacherid=...
 */
export const fetchStudents = async (params?: {
    classid?: string;
    section?: string;
    parentid?: string;
    teacherid?: string;
}): Promise<StudentModel[]> => {
    const searchParams = new URLSearchParams();
    if (params?.classid) searchParams.append('classid', params.classid);
    if (params?.section) searchParams.append('section', params.section);
    if (params?.parentid) searchParams.append('parentid', params.parentid);
    if (params?.teacherid) searchParams.append('teacherid', params.teacherid);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/students${query}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch students');
    return (json?.data || json) as StudentModel[];
};

/**
 * Fetch a single student by ID
 * GET /api/students/:id
 * Returns StudentModel or null (never undefined)
 */
export const fetchStudentById = async (id: string) => {
    const res = await fetch(`/api/students/${encodeURIComponent(id)}`, DEFAULT_FETCH_OPTIONS);

    const json = await parseJsonOrThrow(res, 'Failed to fetch student');
    return json?.data || json;
};

/**
 * Create a new student
 * POST /api/students
 */
export const createStudent = async (data: Partial<StudentModel>): Promise<StudentModel> => {
    const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to create student');
    return (json?.data || json) as StudentModel;
};

/**
 * Update an existing student
 * PUT /api/students/:id
 */
export const updateStudent = async (id: string, data: Partial<StudentModel>): Promise<StudentModel> => {
    const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    const json = await parseJsonOrThrow(res, 'Failed to update student');
    return (json?.data || json) as StudentModel;
};

/**
 * Delete one or more students by ID
 * DELETE /api/students?ids=<id>&ids=<id2>
 */
export const deleteStudents = async (ids: string | string[]): Promise<{ deleted: number; message: string }> => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const searchParams = new URLSearchParams();
    idArray.forEach(id => searchParams.append('ids', id));

    const res = await fetch(`/api/students?${searchParams.toString()}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    const json = await parseJsonOrThrow(res, 'Failed to delete student(s)');
    return (json?.data || json) as { deleted: number; message: string };
};
