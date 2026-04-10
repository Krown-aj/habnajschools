"use client";

import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo
} from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Spinner from "@/components/Spinner/Spinner";
import { toOrdinal, getTeacherRemark } from "@/lib/utils";
import { CONTACT } from "@/constants";

const PROFILE_PLACEHOLDER = "/assets/logo.png";

const Result: React.FC = () => {
    const toast = useRef<Toast | null>(null);
    const params = useParams();
    const router = useRouter();

    let id: string | undefined;
    let studentId: string | undefined;
    let classId: string | undefined;
    let term: string | undefined;
    let session: string | undefined;

    if (typeof params?.id === "string") {
        const decoded = decodeURIComponent(params.id);
        const [firstPart, ...restParts] = decoded.split("&");
        id = firstPart;

        if (restParts.length) {
            const queryString = restParts.join("&");
            const searchParams = new URLSearchParams(queryString);
            studentId = searchParams.get("studentId") ?? undefined;
            classId = searchParams.get("classId") ?? undefined;
            session = searchParams.get("session") ?? undefined;
            term = searchParams.get("term") ?? undefined;
        }
    }

    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const show = useCallback(
        (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => {
            toast.current?.show({ severity, summary, detail, life: 4000 });
        },
        []
    );

    const fetchResult = useCallback(async () => {
        if (!id || !studentId || !classId || !term || !session) return;

        setLoading(true);
        try {
            const res = await fetch(
                `/api/results?gradingId=${encodeURIComponent(id)}&studentId=${encodeURIComponent(
                    studentId
                )}&classId=${encodeURIComponent(classId)}`
            );
            if (!res.ok) throw new Error(`Failed to fetch result (${res.status})`);

            const body = await res.json();
            const payload = body?.data ?? body;

            const sessionEntry = payload.find(
                (p: any) => p.session === session && p.term === term
            );

            if (!sessionEntry) {
                show("warn", "No data", "No result found for the selected session and term.");
                return;
            }

            const grading = sessionEntry.gradings.find(
                (g: any) => g.studentId === studentId
            );

            if (!grading) {
                show("warn", "No data", "No result found for this student.");
                return;
            }

            // Attach class info from payload
            grading.class = sessionEntry.class;

            setResult(grading);
        } catch (err: any) {
            show("error", "Fetch Error", err.message || "Failed to fetch student result");
        } finally {
            setLoading(false);
        }
    }, [id, studentId, classId, term, session, show]);

    useEffect(() => {
        fetchResult();
    }, [fetchResult]);

    const normalizeAssessmentName = useCallback(
        (raw: any) => String(raw ?? "").trim().toUpperCase(),
        []
    );

    const assessmentCols = useMemo(() => {
        if (!result) return [];
        const cols: string[] = [];
        const subjects = result?.grades?.subjects ?? [];

        subjects.forEach((s: any) => {
            (s.assessments ?? []).forEach((a: any) => {
                const nm = normalizeAssessmentName(a?.name);
                if (nm && !cols.includes(nm)) cols.push(nm);
            });
        });

        return cols;
    }, [result, normalizeAssessmentName]);

    const buildSubjectRows = useCallback(() => {
        if (!result) return [];

        const subjects = result?.grades?.subjects ?? [];

        return subjects.map((s: any) => {
            const assessmentScores = (s.assessments ?? [])
                .map((a: any) => Number(a.score))
                .filter((v: number) => !isNaN(v));

            const avg =
                assessmentScores.length > 0
                    ? assessmentScores.reduce((a: any, b: any) => a + b, 0) / assessmentScores.length
                    : null;

            const min =
                assessmentScores.length > 0 ? Math.min(...assessmentScores) : null;

            const max =
                assessmentScores.length > 0 ? Math.max(...assessmentScores) : null;

            const assessmentMap = new Map<string, number | null>();
            (s.assessments ?? []).forEach((a: any) =>
                assessmentMap.set(normalizeAssessmentName(a?.name), a?.score ?? null)
            );

            const assessmentValues: Record<string, number | null> = {};
            assessmentCols.forEach(
                col => (assessmentValues[col] = assessmentMap.get(col) ?? null)
            );

            return {
                subjectName: s.name ?? "",
                ...assessmentValues,
                total: s.score ?? null,
                avg,
                min,
                max,
                grade: s.grade ?? "",
                remark: s.remark ?? "",
                position:
                    s.subjectPosition != null
                        ? toOrdinal(Number(s.subjectPosition))
                        : "-"
            };
        });
    }, [result, assessmentCols, normalizeAssessmentName]);

    const groupTraitsByCategory = useCallback((gradingEntry: any) => {
        const traits = gradingEntry?.grades?.traits ?? [];
        const grouped: Record<string, any[]> = {};
        for (const t of traits) {
            const cat = String(t.category ?? "UNCATEGORIZED").toUpperCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t);
        }
        return grouped;
    }, []);

    // handle back navigation
    const handleBack = useCallback(() => {
        router.back();
    }, []);

    // Convert image URL to Base64
    const getBase64ImageFromUrl = useCallback(async (url?: string | null, placeholder?: string | null) => {
        const safeUrl = url?.trim() ? url : placeholder;
        if (!safeUrl) return null;
        try {
            const res = await fetch(safeUrl);
            const blob = await res.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    }, []);

    // Build downloadable pdf file
    const downloadPdf = useCallback(async () => {
        if (!result) return;
        setProcessing(true);
        const section = result?.class?.section?.toLocaleLowerCase()

        try {
            const doc = new jsPDF();
            const margin = 8;
            const pageWidth = doc.internal.pageSize.getWidth();

            /* ---------------- HEADER ---------------- */
            const logoSize = 20;
            const avatarUrl = result?.avarta ?? PROFILE_PLACEHOLDER;
            const logoUrl = "/assets/logo.png";

            const [logoB64, avatarB64] = await Promise.all([
                getBase64ImageFromUrl(logoUrl, PROFILE_PLACEHOLDER),
                getBase64ImageFromUrl(avatarUrl, PROFILE_PLACEHOLDER),
            ]);

            if (logoB64) doc.addImage(logoB64, "PNG", margin, 8, logoSize, logoSize);
            if (avatarB64) doc.addImage(avatarB64, "PNG", pageWidth - margin - logoSize, 8, logoSize, logoSize);

            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("HABNAJ INTERNATIONAL SCHOOLS", pageWidth / 2, 18, { align: "center" });

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(
                "Plot D 12, Sam Njoma Street, GRA Bauchi, Bauchi State.",
                pageWidth / 2,
                24,
                { align: "center" }
            );
            doc.text(`Email: ${CONTACT.email}, Phone: ${CONTACT.phone}`, pageWidth / 2, 28, { align: "center" });

            doc.setLineWidth(0.4);
            doc.line(margin, 34, pageWidth - margin, 34);

            /* ---------------- STUDENT INFO ---------------- */
            autoTable(doc, {
                startY: 36,
                theme: "grid",
                head: [["Student", "Admission No.", "Class", "Term", "Session", "Next Term Begins"]],
                body: [[
                    `${result.firstname} ${result.othername ?? ""} ${result.surname}`.toUpperCase(),
                    result.admissionnumber ?? "-",
                    result.class?.name ?? "-",
                    term ?? "-",
                    session ?? "-",
                    result?.nextTermBegins ?? "May 11, 2026",
                ]],
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [22, 160, 133] },
                didParseCell: (data) => {
                    if (data.section === "body") {
                        data.cell.styles.fontStyle = "bold";
                    }
                },
                margin: { left: margin, right: margin },
                columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 35 }, 2: { cellWidth: 30 } },
            });

            /* ---------------- SUBJECT TABLE ---------------- */
            const subjectRows = buildSubjectRows();

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 4,
                head: [[
                    "Subject",
                    ...assessmentCols,
                    "Total",
                    "Avg.",
                    "Min.",
                    "Max.",
                    "Position",
                    "Grade",
                    "Remark"
                ]],
                body: subjectRows.map((s: any) => [
                    s.subjectName,
                    ...assessmentCols.map(c => s[c] ?? "-"),
                    s.total ?? "-",
                    s.avg != null ? s.avg.toFixed(2) : "-",
                    s.min ?? "-",
                    s.max ?? "-",
                    s.position,
                    s.grade,
                    s.remark
                ]),
                theme: "grid",
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [22, 160, 133] },
                margin: { left: margin, right: margin }
            });

            /* ---------------- DOMAINS + SUMMARY ---------------- */
            const traitGroups = groupTraitsByCategory(result);
            const domains: any[] = [];

            if (traitGroups.AFFECTIVE)
                domains.push({
                    title: "Affective Domain",
                    rows: traitGroups.AFFECTIVE.map((t: any) => [t.name, t.score]),
                    color: [22, 160, 133]
                });

            if (traitGroups.PSYCHOMOTOR)
                domains.push({
                    title: "Psychomotor Domain",
                    rows: traitGroups.PSYCHOMOTOR.map((t: any) => [t.name, t.score]),
                    color: [52, 152, 219]
                });

            if (traitGroups.BEHAVIOURAL || traitGroups.BEHAVIORAL)
                domains.push({
                    title: "Behavioural Domain",
                    rows: (traitGroups.BEHAVIOURAL ?? traitGroups.BEHAVIORAL).map((t: any) => [t.name, t.score]),
                    color: [30, 64, 175]
                });

            if (section === "nursery" || section === "primary") {
                domains.push({
                    title: "Result Summary",
                    rows: [
                        ["Class Position", result.grades?.classPosition ?? "-"],
                        ["Total Score", result.grades?.totalScore ?? "-"],
                        ["Average Score", result.grades?.averageScore?.toFixed(2) ?? "-"],
                    ],
                    color: [41, 128, 185]
                });
            } else {
                domains.push({
                    title: "Result Summary",
                    rows: [
                        /*  ["Class Position", result.grades?.classPosition ?? "-"], */
                        ["Total Score", result.grades?.totalScore ?? "-"],
                        ["Average Score", result.grades?.averageScore?.toFixed(2) ?? "-"],
                    ],
                    color: [41, 128, 185]
                });
            }

            const startY = (doc as any).lastAutoTable.finalY + 4;
            const width = (pageWidth - margin * 2 - 6 * (domains.length - 1)) / domains.length;

            domains.forEach((d, i) => {
                autoTable(doc, {
                    startY,
                    margin: { left: margin + i * (width + 6) },
                    tableWidth: width,
                    head: [[d.title, ""]],
                    body: d.rows,
                    styles: { fontSize: 7, cellPadding: 3 },
                    headStyles: { fillColor: d.color },
                    theme: "grid",
                });
            });

            /* ---------------- REMARKS ---------------- */
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 47,
                theme: "grid",
                head: [["Remarker", "Remark"]],
                body: [
                    ["Principal", result.grades?.remark ?? "—"],
                    ["Class Teacher", getTeacherRemark(result.grades?.averageScore)],
                ],
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185] },
                margin: { left: margin, right: margin },
            });

            /* ---------------- FOOTER ---------------- */
            const footerY = doc.internal.pageSize.getHeight() - 14;
            doc.setFontSize(7);
            doc.setFont("helvetica", "italic");
            doc.text("Keys: A: Excellent, B: Very Good, C: Good, D: Pass, F: Fail", margin, footerY);
            doc.text('Keys: 5: Excellent, 4: Very Good, 3: Good, 2: Pass, 1: Poor', margin, footerY + 5);
            /*  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, footerY + 5); */

            doc.save(`${result.firstname}_${result.surname}_result.pdf`);
            show("success", "PDF Ready", "Result downloaded successfully");
        } catch (e) {
            show("error", "PDF Error", "Failed to generate PDF");
        } finally {
            setProcessing(false);
        }
    }, [
        result,
        assessmentCols,
        buildSubjectRows,
        groupTraitsByCategory,
        show,
        session,
        term
    ]);

    if (loading) return <Spinner visible onHide={() => { }} />;
    if (!result) return <p className="text-center text-gray-500 mt-4">No result found.</p>;

    return (
        <div className="flex flex-col w-full py-4 px-4">
            <Toast ref={toast} />

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                    {(`${result.firstname} ${result.othername} ${result.surname}`).toLocaleUpperCase()}'s Result
                </h2>
                <div className="flex justify-between items-center">
                    <Button
                        label="Download PDF"
                        icon="pi pi-file-pdf"
                        onClick={downloadPdf}
                        loading={processing}
                    />
                    <Button
                        label="Back"
                        onClick={handleBack}
                        className="bg-red-400 mx-4"
                    />
                </div>
            </div>

            <DataTable value={buildSubjectRows()} scrollable scrollHeight="400px">
                <Column field="subjectName" header="Subject" />
                {assessmentCols.map(col => (
                    <Column
                        key={col}
                        field={col}
                        header={col}
                        body={row => row[col] ?? "-"}
                    />
                ))}
                <Column field="total" header="Total" />
                <Column field="position" header="Position" />
                <Column field="grade" header="Grade" />
                <Column field="remark" header="Remark" />
            </DataTable>
        </div>
    );
};

export default Result;
