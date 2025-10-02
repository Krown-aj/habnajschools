import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession, handleError, successResponse, UserRole } from "@/lib/utils/api-helpers";

/**
 * helper: convert integer position to ordinal string
 * 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, 11->11th, 12->12th, 13->13th etc.
 */
function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * helper: compute remark text from average and passMark (if present).
 * returns a supportive / sensitive remark string.
 *
 * Logic:
 *  - Excellent / Very Good -> warm, encouraging praise.
 *  - Good / Pass -> encouraging, focus on improvement.
 *  - Fair -> cautious but motivating guidance.
 *  - Fail / Below pass -> gentle, constructive encouragement and suggestion to seek help.
 *
 * If passMark provided and student is below it an extra gentle suggestion is appended.
 */
function generateRemark(average: number, passMark?: number | null): string {
    // safety: coerce to number
    const avg = Number(average ?? 0);

    let baseRemark = "Keep working hard.";

    if (avg >= 70) {
        baseRemark = "Excellent work — well done! Keep up the outstanding effort and continue challenging yourself.";
    } else if (avg >= 60) {
        baseRemark = "Very good performance — you're doing really well. Keep practicing and aim for even higher achievements.";
    } else if (avg >= 50) {
        baseRemark = "Good job — solid performance. With a bit more focus and practice you can reach the next level.";
    } else if (avg >= 45) {
        baseRemark = "Pass — you've met the basic requirements. Continue practicing consistently to strengthen your understanding.";
    } else if (avg >= 40) {
        baseRemark = "Fair — you're close. Focus on the areas you find difficult, ask questions, and keep trying.";
    } else {
        baseRemark = "Needs improvement — don't be discouraged. With regular practice, a bit of support, and focused effort you can improve. Reach out to your teacher or parent for help and set small goals.";
    }

    // If passMark exists and student is below it, append a gentle suggestion (non-shaming)
    if (typeof passMark === "number" && avg < passMark) {
        // Be careful with tone: informative + supportive
        const suggestion = ` Note: this is below the pass mark (${passMark}). Please work with your teacher or guardian to identify specific areas to improve — small, steady steps will help.`;
        return baseRemark + suggestion;
    }

    return baseRemark;
}

type GenerateBody = {
    gradingId: string;
    classId?: string;
};

/**
 * GET /api/results
 * Query:
 *  - gradingId (optional)
 *  - classId (optional)
 *  - studentId (optional)
 *
 * Permissions:
 *  - SUPER/ADMIN/MANAGEMENT => access all
 *  - TEACHER => access only to their classes (best-effort using Class.teacherId)
 *  - STUDENT => access only own results (must match session user id)
 *  - PARENT => access to their children (best-effort using Student.parentId)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // validate session and get user info from helper
        const validation = await validateSession([
            UserRole.SUPER,
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
            UserRole.TEACHER,
            UserRole.STUDENT,
            UserRole.PARENT,
        ]);
        if (validation.error) return validation.error;
        const user = (validation as any).user;
        const userRole = validation?.userRole

        const url = new URL(request.url);
        const gradingId = url.searchParams.get("gradingId") ?? undefined;
        const classId = url.searchParams.get("classId") ?? undefined;
        const studentId = url.searchParams.get("studentId") ?? undefined;

        // Build base where clause according to role
        const where: any = {};
        if (gradingId) where.gradingId = gradingId;
        if (classId) where.classId = classId;
        if (studentId) where.studentId = studentId;

        // Role-specific restrictions
        if (userRole === UserRole.TEACHER) {
            // Best-effort: if teacher provided a classId we use it;
            // otherwise try to find classes assigned to this teacher (assumes Class.formmasterid exists).
            if (!classId) {
                const teacherClasses = await prisma.class.findMany({
                    where: { formmasterid: user.id },
                    select: { id: true },
                });
                const ids = teacherClasses.map((c) => c.id);
                if (ids.length === 0) {
                    return NextResponse.json({ error: "No classes assigned to this teacher. Provide classId to query results." }, { status: 403 });
                }
                where.classId = { in: ids };
            }
        } else if (userRole === UserRole.STUDENT) {
            // Students may only view their own report cards
            if (!studentId || studentId !== user.id) {
                return NextResponse.json({ error: "Students may only view their own results. Provide your studentId." }, { status: 403 });
            }
        } else if (userRole === UserRole.PARENT) {
            // Best-effort: find children of this parent via student.parentid (assumption)
            if (!studentId && !classId) {
                const children = await prisma.student.findMany({
                    where: { parentid: user.id }, // ASSUMPTION: Student model has parentid
                    select: { id: true },
                });
                const childIds = children.map((c) => c.id);
                if (childIds.length === 0) {
                    return NextResponse.json({ error: "No children found for this parent. Provide studentId or classId to query." }, { status: 403 });
                }
                where.studentId = { in: childIds };
            }
            if (studentId) {
                const child = await prisma.student.findFirst({ where: { id: studentId, parentid: user.id } });
                if (!child) {
                    return NextResponse.json({ error: "You do not have permission to view that student's results." }, { status: 403 });
                }
            }
        }

        // Fetch report cards
        const reportCards = await prisma.reportCard.findMany({
            where,
            include: {
                student: { select: { id: true, admissionnumber: true, firstname: true, othername: true, surname: true, avarta: true, grades: true, } },
                class: { select: { id: true, name: true } },
                grading: { select: { id: true, title: true, session: true, term: true, } },
            },
            orderBy: { classPosition: "asc" },
        });

        return successResponse(reportCards);
    } catch (error) {
        return handleError(error, "Failed to fetch report cards");
    }
}

/**
 * POST /api/results
 * Body: { gradingId, classId? }
 *
 * Generate report cards for the grading.
 * If classId omitted, generate for ALL classes.
 * Only SUPER/ADMIN/MANAGEMENT allowed to generate.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const body = (await request.json().catch(() => null)) as GenerateBody | null;
        if (!body || !body.gradingId) {
            return NextResponse.json({ error: "gradingId is required" }, { status: 400 });
        }
        const { gradingId, classId } = body;

        // verify grading exists and load gradingPolicy to get passMark
        const grading = await prisma.grading.findUnique({
            where: { id: gradingId },
            include: { gradingPolicy: true },
        });
        if (!grading) return NextResponse.json({ error: "Grading not found" }, { status: 404 });
        const passMark = grading.gradingPolicy?.passMark ?? null;

        // Determine classes to process
        let classesToProcess: string[] = [];
        if (classId) {
            // ensure class exists
            const cls = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
            if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
            classesToProcess = [classId];
        } else {
            const allClasses = await prisma.class.findMany({ select: { id: true } });
            classesToProcess = allClasses.map((c) => c.id);
            if (classesToProcess.length === 0) {
                return NextResponse.json({ error: "No classes found to generate report cards for" }, { status: 404 });
            }
        }

        // fetch all students in the classes being processed
        const studentsInClasses = await prisma.student.findMany({
            where: { classid: { in: classesToProcess } },
            select: { id: true, admissionnumber: true, firstname: true, othername: true, surname: true, classid: true },
        });

        if (!studentsInClasses.length) {
            return NextResponse.json({ error: "No students found in the selected class(es)" }, { status: 404 });
        }

        // fetch all grades for this gradingId (for any class)
        const grades = await prisma.studentGrade.findMany({
            where: { gradingId },
            select: { studentId: true, score: true, subjectId: true, classId: true },
        });

        // compute totals & counts per student
        const totals = new Map<string, { total: number; count: number }>();
        for (const g of grades) {
            const s = totals.get(g.studentId) ?? { total: 0, count: 0 };
            s.total += Number(g.score ?? 0);
            s.count += 1;
            totals.set(g.studentId, s);
        }

        // Build create payloads per class
        const createPayloadAll: Array<{
            totalScore: number;
            averageScore: number;
            classPosition: string | null;
            remark: string | null;
            formmasterRemark: string | null;
            studentId: string;
            classId: string;
            gradingId: string;
        }> = [];

        for (const clsId of classesToProcess) {
            const studentsOfClass = studentsInClasses.filter((s) => s.classid === clsId);
            if (!studentsOfClass.length) continue;

            const cardsForClass = studentsOfClass.map((stu) => {
                const stat = totals.get(stu.id);
                const totalScore = stat ? stat.total : 0;
                const averageScore = stat && stat.count > 0 ? stat.total / stat.count : 0;
                const remark = generateRemark(averageScore, passMark ?? undefined);
                return {
                    totalScore,
                    averageScore,
                    classPosition: null as string | null,
                    remark,
                    formmasterRemark: null as string | null,
                    studentId: stu.id,
                    classId: clsId,
                    gradingId,
                };
            });

            // compute positions for this class (desc). ties get same position number (1,2,2,4)
            const sorted = [...cardsForClass].sort((a, b) => b.averageScore - a.averageScore);
            const positions: Record<string, number> = {};
            let pos = 0;
            let lastScore: number | null = null;
            for (let i = 0; i < sorted.length; i++) {
                const sc = sorted[i].averageScore;
                if (lastScore === null || sc !== lastScore) {
                    pos = i + 1;
                }
                positions[sorted[i].studentId] = pos;
                lastScore = sc;
            }

            // attach ordinal position strings
            for (const c of cardsForClass) {
                const p = positions[c.studentId];
                c.classPosition = typeof p === "number" ? ordinal(p) : null;
                createPayloadAll.push({
                    totalScore: c.totalScore,
                    averageScore: c.averageScore,
                    classPosition: c.classPosition,
                    remark: c.remark,
                    formmasterRemark: c.formmasterRemark,
                    studentId: c.studentId,
                    classId: c.classId,
                    gradingId: c.gradingId,
                });
            }
        }

        // Persist: delete existing report cards for these classes & grading; bulk create new ones
        const result = await prisma.$transaction(
            async (tx) => {
                // delete existing reportcards for the grading across the classes
                await tx.reportCard.deleteMany({
                    where: {
                        gradingId,
                        classId: { in: classesToProcess },
                    },
                });

                if (createPayloadAll.length > 0) {
                    // createMany in bulk
                    await tx.reportCard.createMany({
                        data: createPayloadAll,
                        skipDuplicates: true,
                    });
                }

                // fetch and return the created reportCards with relations for the classes processed
                const created = await tx.reportCard.findMany({
                    where: { gradingId, classId: { in: classesToProcess } },
                    include: {
                        student: { select: { id: true, admissionnumber: true, firstname: true, othername: true, surname: true } },
                        grading: { select: { id: true, title: true, session: true, term: true } },
                        class: { select: { id: true, name: true } },
                    },
                    orderBy: [{ classId: "asc" }, { classPosition: "asc" }],
                });

                return created;
            },
            { timeout: 30000 }
        );

        return successResponse(result);
    } catch (error) {
        return handleError(error, "Failed to generate report cards");
    }
}

/**
 * DELETE /api/report-cards?ids=...
 * Bulk delete by ids
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const result = await prisma.reportCard.deleteMany({ where: { id: { in: ids } } });

        return successResponse({ deleted: result.count, message: `Deleted ${result.count} report cards` });
    } catch (error) {
        return handleError(error, "Failed to delete report cards");
    }
}
