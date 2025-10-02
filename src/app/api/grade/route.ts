import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validateSession,
  handleError,
  successResponse,
  UserRole,
} from "@/lib/utils/api-helpers";

// Types for incoming payload
type PerAssessmentInput = { assessmentId: string; score: number };
type StudentInput = {
  studentId: string;
  perAssessmentScores?: PerAssessmentInput[];
};
type BulkUpsertBody = {
  subjectId: string;
  classId: string;
  gradingId: string;
  assessments: string[]; // assessment ids (CA1, CA2, Exam)
  students: StudentInput[];
};

// Lightweight server-side return/types for clarity
type AssessmentDef = {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
};

type StudentShort = {
  id: string;
  firstname?: string | null;
  surname?: string | null;
  othername?: string | null;
  admissionnumber?: string | null;
};

type StudentAssessmentRow = {
  id: string;
  studentId: string;
  assessmentId: string;
  subjectId: string;
  classId: string;
  gradingId: string;
  score: number;
  assessment?: AssessmentDef;
  student?: StudentShort;
};

async function computeGradeAndRemark(total: number, gradingId: string) {
  if (total >= 70) return { grade: "A", remark: "Excellent" };
  if (total >= 60) return { grade: "B", remark: "Very Good" };
  if (total >= 50) return { grade: "C", remark: "Good" };
  if (total >= 45) return { grade: "D", remark: "Pass" };
  if (total >= 40) return { grade: "E", remark: "Fair" };
  return { grade: "F", remark: "Fail" };
}

function chunkArray<T>(arr: T[], size = 50): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * GET: returns:
 * {
 *   data: {
 *     grades: StudentGrade[],
 *     studentAssessments: StudentAssessment[],
 *     assessments: Assessment[]  
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([
      UserRole.SUPER,
      UserRole.ADMIN,
      UserRole.MANAGEMENT,
      UserRole.TEACHER,
    ]);
    if (validation.error) return validation.error;

    const url = new URL(request.url);
    const classId = url.searchParams.get("classId") ?? undefined;
    const subjectId = url.searchParams.get("subjectId") ?? undefined;
    const gradingId = url.searchParams.get("gradingId") ?? undefined;
    const studentId = url.searchParams.get("studentId") ?? undefined;

    const where: any = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (gradingId) where.gradingId = gradingId;
    if (studentId) where.studentId = studentId;

    // fetch grades and studentAssessments in parallel
    const [grades, studentAssessments] = await Promise.all([
      prisma.studentGrade.findMany({
        where,
        include: {
          assessments: { select: { id: true, name: true, weight: true, maxScore: true } },
          student: { select: { id: true, admissionnumber: true, firstname: true, surname: true, othername: true } },
        },
        orderBy: { score: "desc" },
      }),
      prisma.studentAssessment.findMany({
        where,
        include: {
          assessment: { select: { id: true, name: true, weight: true, maxScore: true } },
          student: { select: { id: true, admissionnumber: true, firstname: true, surname: true, othername: true } },
        },
        orderBy: [
          { studentId: "asc" },
          { assessmentId: "asc" },
        ],
      }),
    ]);

    // also return assessment definitions from gradingPolicy (if gradingId present)
    let assessments: AssessmentDef[] = [];
    if (gradingId) {
      const grading = await prisma.grading.findUnique({
        where: { id: gradingId },
        select: { gradingPolicyId: true },
      });
      if (grading?.gradingPolicyId) {
        const found = await prisma.assessment.findMany({
          where: { gradingPolicyId: grading.gradingPolicyId },
          select: { id: true, name: true, weight: true, maxScore: true },
          orderBy: { createdAt: "asc" },
        });
        // cast to the explicit type so TS doesn't infer any[]
        assessments = found as AssessmentDef[];
      }
    }

    return successResponse({ data: { grades, studentAssessments, assessments } });
  } catch (error) {
    console.error("Failed to fetch student grades/assessments:", error);
    return handleError(error, "Failed to fetch student grades and assessments");
  }
}

/**
 * POST: bulk upsert per-assessment marks and aggregated grades.
 * Returns { data: processedGrades, studentAssessments: [...], meta: {...} }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([
      UserRole.SUPER,
      UserRole.ADMIN,
      UserRole.MANAGEMENT,
      UserRole.TEACHER,
    ]);
    if (validation.error) return validation.error;

    const url = new URL(request.url);
    const rawBody = await request.json().catch(() => null);

    let subjectId: string | undefined;
    let classId: string | undefined;
    let gradingId: string | undefined;
    let assessments: string[] | undefined;
    let students: StudentInput[] | undefined;

    if (Array.isArray(rawBody)) {
      students = rawBody as StudentInput[];
      subjectId = url.searchParams.get("subjectId") ?? undefined;
      classId = url.searchParams.get("classId") ?? undefined;
      gradingId = url.searchParams.get("gradingId") ?? undefined;
      const assParam = url.searchParams.get("assessments") ?? "";
      assessments = assParam ? assParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    } else if (rawBody && typeof rawBody === "object") {
      subjectId = rawBody.subjectId ?? url.searchParams.get("subjectId") ?? undefined;
      classId = rawBody.classId ?? url.searchParams.get("classId") ?? undefined;
      gradingId = rawBody.gradingId ?? url.searchParams.get("gradingId") ?? undefined;
      assessments = Array.isArray(rawBody.assessments)
        ? rawBody.assessments
        : (url.searchParams.get("assessments") ? url.searchParams.get("assessments")!.split(",").map(s => s.trim()).filter(Boolean) : undefined);
      students = rawBody.students ?? undefined;
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!subjectId || !classId || !gradingId || !Array.isArray(assessments) || !Array.isArray(students)) {
      return NextResponse.json({ error: "Missing required fields. Provide subjectId, classId, gradingId, assessments and students." }, { status: 400 });
    }
    if (assessments.length === 0 || students.length === 0) {
      return NextResponse.json({ error: "Assessments and students arrays must not be empty." }, { status: 400 });
    }

    // validate assessments & grading policy
    const foundAssessments = await prisma.assessment.findMany({
      where: { id: { in: assessments } },
      select: { id: true, maxScore: true, gradingPolicyId: true },
    });

    if (foundAssessments.length !== assessments.length) {
      return NextResponse.json({ error: "Failed to validate assessments." }, { status: 400 });
    }

    const grading = await prisma.grading.findUnique({ where: { id: gradingId }, select: { id: true, gradingPolicyId: true } });
    if (!grading) return NextResponse.json({ error: "Invalid grading." }, { status: 404 });

    const mismatched = foundAssessments.find((a) => a.gradingPolicyId !== grading.gradingPolicyId);
    if (mismatched) return NextResponse.json({ error: "Invalid assessment grading policy" }, { status: 400 });

    // validate student shapes
    for (const [idx, s] of students.entries()) {
      if (!s || !s.studentId) return NextResponse.json({ error: `students[${idx}].studentId is required` }, { status: 400 });
      if (s.perAssessmentScores) {
        if (!Array.isArray(s.perAssessmentScores) || s.perAssessmentScores.length === 0) {
          return NextResponse.json({ error: `students[${idx}].perAssessmentScores must be a non-empty array if provided` }, { status: 400 });
        }
        for (const pa of s.perAssessmentScores) {
          if (!assessments.includes(pa.assessmentId)) {
            return NextResponse.json({ error: `students[${idx}] references unknown assessment ${pa.assessmentId}` }, { status: 400 });
          }
          if (typeof pa.score !== "number" || pa.score < 0) {
            return NextResponse.json({ error: `invalid score for student[${idx}] assessment ${pa.assessmentId}` }, { status: 400 });
          }
          const def = foundAssessments.find((f) => f.id === pa.assessmentId);
          if (def?.maxScore != null && pa.score > def.maxScore) {
            return NextResponse.json({ error: `score for assessment ${pa.assessmentId} exceeds maxScore` }, { status: 400 });
          }
        }
      }
    }

    // Transaction: upsert studentAssessment rows and create/update StudentGrade rows.
    const processedGrades = await prisma.$transaction(
      async (tx) => {
        const upsertedGrades: { id: string; studentId: string }[] = [];

        for (const s of students) {
          const { studentId, perAssessmentScores = [] } = s;

          if (perAssessmentScores.length) {
            const paIds = perAssessmentScores.map((p) => p.assessmentId);

            const existingRows = await tx.studentAssessment.findMany({
              where: {
                studentId,
                assessmentId: { in: paIds },
                subjectId,
                classId,
                gradingId,
              },
              select: { id: true, assessmentId: true },
            });

            const existingByAssessment = new Map<string, string>();
            for (const er of existingRows) existingByAssessment.set(er.assessmentId, er.id);

            const updateOps: Promise<any>[] = [];
            const createOps: Promise<any>[] = [];

            for (const pa of perAssessmentScores) {
              const existingId = existingByAssessment.get(pa.assessmentId);
              if (existingId) {
                updateOps.push(tx.studentAssessment.update({ where: { id: existingId }, data: { score: pa.score } }));
              } else {
                createOps.push(tx.studentAssessment.create({ data: { studentId, assessmentId: pa.assessmentId, subjectId, classId, gradingId, score: pa.score } }));
              }
            }

            await Promise.all([...updateOps, ...createOps]);
          }

          // compute total (aggregate)
          const agg = await tx.studentAssessment.aggregate({
            where: { studentId, subjectId, classId, gradingId },
            _sum: { score: true },
          });
          const totalScore = (agg._sum?.score ?? 0) as number;

          // grade & remark
          const { grade, remark } = await computeGradeAndRemark(totalScore, gradingId);

          // upsert StudentGrade by composite lookup
          const existingGrade = await tx.studentGrade.findFirst({
            where: { studentId, gradingId, subjectId, classId },
            select: { id: true },
          });

          let studentGrade;
          if (existingGrade) {
            studentGrade = await tx.studentGrade.update({
              where: { id: existingGrade.id },
              data: {
                score: totalScore,
                grade,
                remark,
                assessments: { set: assessments.map((id) => ({ id })) },
              },
            });
          } else {
            studentGrade = await tx.studentGrade.create({
              data: {
                studentId,
                subjectId,
                classId,
                gradingId,
                score: totalScore,
                grade,
                remark,
                assessments: { connect: assessments.map((id) => ({ id })) },
              },
            });
          }

          upsertedGrades.push({ id: studentGrade.id, studentId });
        }

        // return fresh studentGrade rows for processed students
        const ids = upsertedGrades.map((g) => g.id);
        const refreshed = await tx.studentGrade.findMany({
          where: { id: { in: ids } },
          include: { assessments: true, student: true },
        });

        return refreshed;
      },
      { timeout: 120_000 }
    );

    // position recomputation outside transaction
    const CHUNK_SIZE = 50;
    let positionsRecomputed = true;
    let recomputeError: string | undefined;
    try {
      const peers = await prisma.studentGrade.findMany({
        where: { subjectId, classId, gradingId },
        orderBy: { score: "desc" },
        select: { id: true, studentId: true },
      });

      const updates = peers.map((p, idx) => ({ id: p.id, position: String(idx + 1) }));
      const chunks = chunkArray(updates, CHUNK_SIZE);

      for (const chunk of chunks) {
        await Promise.all(chunk.map((u) => prisma.studentGrade.update({ where: { id: u.id }, data: { subjectPosition: u.position } })));
      }
    } catch (err: any) {
      positionsRecomputed = false;
      recomputeError = err?.message ?? String(err);
      console.error("Position recomputation failed:", err);
    }

    // fetch studentAssessment rows for processed students
    const processedStudentIds = students.map((s) => s.studentId);
    let freshStudentAssessments: StudentAssessmentRow[] = [];
    try {
      const found = await prisma.studentAssessment.findMany({
        where: {
          subjectId,
          classId,
          gradingId,
          studentId: { in: processedStudentIds },
        },
        include: {
          assessment: { select: { id: true, name: true, maxScore: true, weight: true } },
          student: { select: { id: true, firstname: true, surname: true, othername: true } },
        },
      });
      freshStudentAssessments = found as StudentAssessmentRow[];
    } catch (err) {
      console.warn("Could not fetch fresh student assessments after save:", err);
      freshStudentAssessments = [];
    }

    return successResponse(
      {
        data: processedGrades,
        studentAssessments: freshStudentAssessments,
        meta: { positionsRecomputed, recomputeError: positionsRecomputed ? undefined : recomputeError },
      },
      200
    );
  } catch (error) {
    console.error("Failed to bulk upsert student grades:", error);
    return handleError(error, "Failed to bulk upsert student grades");
  }
}
