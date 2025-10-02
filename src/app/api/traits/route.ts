import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession, handleError, successResponse, checkResourceExists, UserRole } from "@/lib/utils/api-helpers";

/**
 * Local types for clarity
 */
type TraitInput = {
    traitId: string;
    score: number;
    remark?: string | null;
};

type PostBody = {
    gradingId: string;
    classId?: string;
    studentId: string;
    traits: TraitInput[];
};

type CreatePayload = {
    traitId: string;
    studentId: string;
    gradingId: string;
    score: number;
    remark?: string | undefined;
};

type UpdatePayload = {
    id: string;
    score: number;
    remark?: string | null;
};

/**
 * GET handler
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const gradingId = url.searchParams.get("gradingId");
        const studentId = url.searchParams.get("studentId");

        if (!gradingId || !studentId) {
            return NextResponse.json({ error: "Grading and student are required" }, { status: 400 });
        }

        const gradingExists = await prisma.grading.findUnique({ where: { id: gradingId } });
        if (!gradingExists) {
            return NextResponse.json({ error: "Grading not found" }, { status: 404 });
        }

        const studentExists = await prisma.student.findUnique({ where: { id: studentId } });
        if (!studentExists) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        const rows = await prisma.studentTrait.findMany({
            where: { gradingId, studentId },
            include: { trait: true },
        });

        return successResponse(rows);
    } catch (error) {
        return handleError(error, "Failed to fetch student traits");
    }
}

/**
 * POST handler - upsert student traits for a given grading & student
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const body = (await request.json().catch(() => null)) as PostBody | null;
        if (!body) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { gradingId, studentId, traits } = body;

        if (!gradingId || !studentId || !Array.isArray(traits)) {
            return NextResponse.json({ error: "Grading, student and traits are required" }, { status: 400 });
        }

        if (traits.length === 0) {
            return NextResponse.json({ error: "You must provide traits" }, { status: 400 });
        }

        // Validate trait entries
        for (const t of traits) {
            if (!t || typeof t.traitId !== "string" || t.traitId.trim().length === 0) {
                return NextResponse.json({ error: "Each trait must include a traitId" }, { status: 400 });
            }
            const scoreNum = Number(t.score ?? 0);
            if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 5) {
                return NextResponse.json({ error: "Trait score must be a number between 0 and 5" }, { status: 400 });
            }
        }

        // Verify grading & student exist
        const [gradingExists, studentExists] = await Promise.all([
            prisma.grading.findUnique({ where: { id: gradingId } }),
            prisma.student.findUnique({ where: { id: studentId } }),
        ]);
        if (!gradingExists) return NextResponse.json({ error: "Grading not found" }, { status: 404 });
        if (!studentExists) return NextResponse.json({ error: "Student not found" }, { status: 404 });

        // Optional: verify traits belong to grading policy
        const gradingPolicyId = gradingExists.gradingPolicyId;
        if (gradingPolicyId) {
            const traitIds = traits.map((t) => t.traitId);
            const existingTraits = await prisma.trait.findMany({
                where: { id: { in: traitIds }, gradingpolicyId: gradingPolicyId },
                select: { id: true },
            });
            const found = new Set(existingTraits.map((t) => t.id));
            const missing = traitIds.filter((id) => !found.has(id));
            if (missing.length > 0) {
                return NextResponse.json({ error: `Traits not found or not part of grading policy: ${missing.join(", ")}` }, { status: 400 });
            }
        }

        // Read existing rows for the (gradingId, studentId) limited to traitIds we will process
        const traitIdsToHandle = traits.map((t) => t.traitId);
        const existingRows = await prisma.studentTrait.findMany({
            where: {
                gradingId,
                studentId,
                traitId: { in: traitIdsToHandle },
            },
        });

        const existingByTrait = new Map<string, { id: string; traitId: string; score: number; remark?: string | null }>();
        for (const r of existingRows) existingByTrait.set(r.traitId, { id: r.id, traitId: r.traitId, score: r.score, remark: r.remark });

        // Partition into creates and updates with explicit types
        const toCreate: CreatePayload[] = [];
        const toUpdate: UpdatePayload[] = [];

        for (const t of traits) {
            const normalizedScore = Math.max(0, Math.min(5, Math.round(Number(t.score) || 0)));
            const existing = existingByTrait.get(t.traitId);
            if (existing) {
                toUpdate.push({
                    id: existing.id,
                    score: normalizedScore,
                    remark: t.remark ?? existing.remark ?? null,
                });
            } else {
                const createObj: CreatePayload = {
                    traitId: t.traitId,
                    studentId,
                    gradingId,
                    score: normalizedScore,
                };
                if (t.remark !== undefined) createObj.remark = t.remark || undefined;
                toCreate.push(createObj);
            }
        }

        // Execute DB work in transaction
        const updatedRows = await prisma.$transaction(
            async (tx) => {
                if (toCreate.length > 0) {
                    const createPayload = toCreate.map((c) => {
                        const obj: any = {
                            traitId: c.traitId,
                            studentId: c.studentId,
                            gradingId: c.gradingId,
                            score: c.score,
                        };
                        if (c.remark !== undefined) obj.remark = c.remark;
                        return obj;
                    });
                    await tx.studentTrait.createMany({
                        data: createPayload,
                        skipDuplicates: true,
                    });
                }

                if (toUpdate.length > 0) {
                    await Promise.all(
                        toUpdate.map((u) =>
                            tx.studentTrait.update({
                                where: { id: u.id },
                                data: {
                                    score: u.score,
                                    remark: u.remark,
                                },
                            })
                        )
                    );
                }

                // Return up-to-date rows
                return tx.studentTrait.findMany({
                    where: {
                        gradingId,
                        studentId,
                        traitId: { in: traitIdsToHandle },
                    },
                    include: { trait: true },
                });
            },
            { timeout: 30000 }
        );

        return successResponse(updatedRows);
    } catch (error) {
        return handleError(error, "Failed to save student traits");
    }
}
