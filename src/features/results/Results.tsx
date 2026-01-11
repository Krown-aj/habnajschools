"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaPlus, FaEllipsisV, FaTrash, FaEye } from "react-icons/fa";
import { AiOutlinePrinter, AiOutlineFileZip } from "react-icons/ai";
import { Award } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta, DataTableFilterMetaData } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import moment from "moment";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import Spinner from "@/components/Spinner/Spinner";

type GradingDto = {
    id: string;
    title?: string;
    session?: string;
    term?: string;
    published?: boolean;
    gradingPolicyId?: string;
    studentGrades: []
    studentTraits: []
};

type ClassDto = { id: string; name: string };

type ReportCardRaw = any;

type ReportCardRow = {
    id: string;
    studentId: string;
    studentName: string;
    admissionnumber?: string;
    class?: string;
    average?: number;
    overallPosition?: string;
    createdAt?: string;
    _raw?: ReportCardRaw;
};

type SubjectRow = {
    subjectName?: string;
    [key: string]: number | string | null | undefined; // Dynamic for assessments
    total?: number | null;
    avg?: number | null;
    grade?: string;
    remark?: string;
    position?: string;
};

const Results: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useRef<Toast | null>(null);
    const panel = useRef<OverlayPanel | null>(null);

    const [gradings, setGradings] = useState<GradingDto[]>([]);
    const [classes, setClasses] = useState<ClassDto[]>([]);
    const [results, setResults] = useState<ReportCardRow[]>([]);
    const [selected, setSelected] = useState<ReportCardRow[]>([]);
    const [current, setCurrent] = useState<ReportCardRow | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);

    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || "Guest";
    const permitGenerate = ["super", "admin", "management"].includes(String(role).toLowerCase());

    const show = useCallback((severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => {
        toast.current?.show({ severity, summary, detail, life: 4000 });
    }, []);

    const sessionOptions = useMemo(() => {
        const s = new Set<string>();
        for (const g of gradings) if (g.session) s.add(g.session);
        return Array.from(s).map((session) => ({ label: session, value: session }));
    }, [gradings]);

    const termOptions = useMemo(
        () => [
            { label: "1st Term", value: "First" },
            { label: "2nd Term", value: "Second" },
            { label: "3rd Term", value: "Third" },
        ],
        []
    );

    const classOptions = useMemo(() => classes.map((c) => ({ label: c.name, value: c.id })), [classes]);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const load = async () => {
            setLoading(true);
            try {
                const [gRes, cRes] = await Promise.all([
                    fetch("/api/gradings", { signal: controller.signal }),
                    fetch("/api/classes", { signal: controller.signal }),
                ]);

                if (!gRes.ok) throw new Error(`Failed to load gradings (${gRes.status})`);
                if (!cRes.ok) throw new Error(`Failed to load classes (${cRes.status})`);

                const gBody = await gRes.json().catch(() => ({}));
                const cBody = await cRes.json().catch(() => ({}));

                if (!mounted) return;
                setGradings(gBody?.data ?? gBody ?? []);
                setClasses(cBody?.data ?? cBody ?? []);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                show("error", "Load error", err.message || "Failed to load initial data");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [show]);

    const findGrading = useCallback(() => {
        if (!selectedSession || !selectedTerm) return undefined;
        const mygradings = gradings.find((g) => String(g.session) === String(selectedSession) && String(g.term) === String(selectedTerm));
        console.log("Grading result of student:", gradings)
        return mygradings
    }, [gradings, selectedSession, selectedTerm]);

    const transformRows = useCallback((rows: any[]): ReportCardRow[] => {
        return rows.map((r) => ({
            id: r.id,
            studentId: r.studentId,
            studentName: `${r.student?.firstname ?? ""} ${r.student?.othername ?? ""} ${r.student?.surname ?? ""}`.trim(),
            admissionnumber: r.student?.admissionnumber,
            class: r.class?.name ?? "",
            average: typeof r.averageScore === "number" ? r.averageScore : (r.averageScore ? Number(r.averageScore) : undefined),
            overallPosition: r.classPosition ?? "",
            createdAt: r.createdAt ?? r.updatedAt ?? undefined,
            _raw: r,
        }));
    }, []);

    const fetchResults = useCallback(
        async (gradingId: string, classId: string) => {
            setLoading(true);
            try {
                const url = `/api/results?gradingId=${encodeURIComponent(gradingId)}&classId=${encodeURIComponent(classId)}`;
                const res = await fetch(url);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.error || `Status ${res.status}`);
                }
                const body = await res.json();
                const rows = (body?.data ?? body) || [];
                setResults(transformRows(rows));
            } catch (err: any) {
                show("error", "Fetch Error", err.message || "Failed to fetch results");
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [show, transformRows]
    );

    const handleGenerate = useCallback(async () => {
        const grading = findGrading();
        if (!grading) {
            show("warn", "Select grading", "Choose a session and term that correspond to a grading.");
            return;
        }
        if (!selectedClass) {
            show("warn", "Select class", "Please pick a class.");
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gradingId: grading.id, classId: selectedClass }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || `Status ${res.status}`);
            }
            const body = await res.json();
            const rows = (body?.data ?? body) || [];
            setResults(transformRows(rows));
            show("success", "Generated", "Report cards generated successfully.");
        } catch (err: any) {
            show("error", "Generation Error", err.message || "Failed to generate report cards");
        } finally {
            setProcessing(false);
        }
    }, [findGrading, selectedClass, show, transformRows]);

    useEffect(() => {
        if (!selectedSession || !selectedTerm || !selectedClass) {
            setResults([]);
            return;
        }
        const grading = findGrading();
        if (!grading) {
            setResults([]);
            show("warn", "No Grading Found", "No grading found for the selected session and term. Please create the grading first.");
            return;
        }
        void fetchResults(grading.id, selectedClass);
    }, [selectedSession, selectedTerm, selectedClass, findGrading, fetchResults, show]);

    const deleteApi = useCallback(async (ids: string[]) => {
        const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/results?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || `Status ${res.status}`);
        }
        return res;
    }, []);

    const confirmDelete = useCallback(
        (ids: string[]) => {
            if (!ids.length) return;
            if (!confirm(`Delete ${ids.length} report card(s)? This action cannot be undone.`)) return;
            setDeletingIds(ids);
            deleteApi(ids)
                .then(() => {
                    show("success", "Deleted", `${ids.length} report card(s) deleted`);
                    setResults((prev) => prev.filter((r) => !ids.includes(r.id)));
                    setSelected((prev) => prev.filter((r) => !ids.includes(r.id)));
                })
                .catch((err: any) => show("error", "Delete error", err.message || "Failed to delete"))
                .finally(() => setDeletingIds([]));
        },
        [deleteApi, show]
    );

    const handleView = useCallback((row: ReportCardRow) => {
        router.push(`/dashboard/${role}/report-cards/${row.id}/view`);
        panel.current?.hide();
    }, [router, role]);

    // Utility: convert image URL to base64 (for embedding logos/avatars)
    const getBase64ImageFromUrl = useCallback(async (url?: string | null) => {
        if (!url) return null;
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            // fail gracefully
            return null;
        }
    }, []);

    // Extract subject rows dynamically from studentGrades and studentAssessments
    const extractSubjectRows = (raw: any): SubjectRow[] => {
        console.log('Received Gradings:', raw)
        const studentGrades = raw;
        const studentAssessments = raw?.studentAssessments || [];

        return studentGrades.map((sg: any) => {
            const subjectAssessments = studentAssessments.filter((sa: any) => sa.subjectId === sg.subjectId);
            const breakdown: Partial<SubjectRow> = {};

            subjectAssessments.forEach((sa: any) => {
                const key = (sa.assessment?.name || 'unknown').toLowerCase().replace(/\s+/g, '');
                breakdown[key] = sa.score;
            });

            return {
                subjectName: sg.subject?.name || "",
                ...breakdown,
                total: sg.score,
                grade: sg.grade || "",
                remark: sg.remark || "",
                position: sg.subjectPosition || "",
                avg: null, // Not available in schema, can remove if unnecessary
            } as SubjectRow;
        });
    };

    // Extract traits grouped by category
    const getTraitsByCategory = (raw: any, category: string) => {
        const studentTraits = raw?.studentTraits || [];
        return studentTraits
            .filter((st: any) => st.trait?.category === category.toUpperCase())
            .map((st: any) => ({
                name: st.trait?.name || "",
                score: st.score,
                remark: st.remark || "",
            }));
    };

    // Build a single student's PDF page(s)
    const buildStudentPdf = async (doc: jsPDF, row: ReportCardRow, idx: number, total: number) => {
        const margin = 5;
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoWidth = 20
        const logoHeight = 20

        // --- Header: left logo, center school text, right avatar ---
        const logoUrlCandidate = "/assets/logo.png"; // change to your real logo path if available
        const avatarUrl = row._raw?.student?.avarta ?? row._raw?.avarta ?? "/assets/profile.png";

        const [logoB64, avatarB64] = await Promise.all([getBase64ImageFromUrl(logoUrlCandidate), getBase64ImageFromUrl(avatarUrl)]);

        // Draw logo left
        if (logoB64) {
            try {
                doc.addImage(logoB64, "PNG", margin, 5, logoWidth, logoHeight);
            } catch (e) {
                /* ignore image add errors */
            }
        }

        // Draw avatar right
        if (avatarB64) {
            try {
                doc.addImage(avatarB64, "PNG", pageWidth - margin - logoWidth, 5, logoWidth, logoHeight);
            } catch (e) {
                /* ignore image add errors */
            }
        }

        // School name and address centered
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("HABNAJ INTERNATIONAL SCHOOLS", pageWidth / 2, margin + 12, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(["Plot D 12, Sam Njoma Street, GRA Bauchi, Bauchi State.", "Email: habnaj2021international@gmail.com, Phone: +2349054985027", ""], pageWidth / 2, margin + 16, { align: "center" });

        // Small separator line
        doc.setLineWidth(0.4);
        doc.line(margin, margin + 24, pageWidth - margin, margin + 24);
        doc.line(margin, margin + 26, pageWidth - margin, margin + 26);

        // --- Student info table ---
        const gradingTitle = row._raw?.grading?.title ?? "";
        const term = row._raw?.grading?.term ?? selectedTerm;
        const session = row._raw?.grading?.session ?? selectedSession;
        const nextTermBegins = row._raw?.nextTermBegins ?? "January 15, 2024";

        let y = 34
        autoTable(doc, {
            startY: y,
            theme: "grid",
            head: [
                ["Student", "Admission No.", "Class", "Term", "Session", "Next Term Begins"]
            ],
            body: [
                [row.studentName || "", row.admissionnumber || "", row.class || "", String(term || ""), String(session || ""), nextTermBegins],
            ],
            styles: { fontSize: 10, },
            margin: { left: margin, right: margin },
            columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: "auto" } },
        });

        // position after student info
        const infoY = ((doc as any).lastAutoTable?.finalY) ?? (margin + 34 + 40);

        // --- Cognitive Domain (subjects table) ---
        //console.log("given row gradidng:", row._raw.grading)
        const gradingData = gradings.find(grading => grading.id === row._raw.grading.id)
        //console.log("Grading data:", gradingData)
        const assessments = gradingData?.studentGrades || [];
        const traits = gradingData?.studentTraits || []
        const subjects = extractSubjectRows(gradingData);
        console.log("Student Assesments:", assessments)
        console.log("Student Traits:", traits)
        const assNames = assessments.map((a: any) => a.name || "Unknown");

        if (subjects.length) {
            const head = [
                ["Subject", ...assNames, "Total", "Grade", "Remark", "Position"],
            ];

            const body = subjects.map((s: any) => {
                const assScores = assNames.map((name: string) => {
                    const key = name.toLowerCase().replace(/\s+/g, '');
                    return s[key] != null ? String(s[key]) : "-";
                });
                return [
                    s.subjectName ?? "",
                    ...assScores,
                    s.total != null ? String(s.total) : "-",
                    s.grade ?? "-",
                    s.remark ?? "-",
                    s.position ?? "-",
                ];
            });

            autoTable(doc, {
                startY: infoY + 8,
                head,
                body,
                theme: "striped",
                styles: { fontSize: 8 },
                margin: { left: margin, right: margin },
                headStyles: { fillColor: [41, 128, 185] },
            });
        } else {
            const summaryY = ((doc as any).lastAutoTable?.finalY) ?? (infoY + 16);
            doc.setFontSize(9);
            doc.text("No cognitive (subject) breakdown available.", margin, summaryY);
        }

        // position after cognitive area
        const cognitiveY = ((doc as any).lastAutoTable?.finalY) ?? (infoY + 90);

        // --- Affective & Psychomotor side-by-side ---
        const affective = getTraitsByCategory(row._raw, "AFFECTIVE");
        const psychomotor = getTraitsByCategory(row._raw, "PSYCHOMOTOR");

        const halfWidth = (pageWidth - margin * 2) / 2 - 6;
        let domainStartY = cognitiveY + 10;

        if (affective.length) {
            autoTable(doc, {
                startY: domainStartY,
                margin: { left: margin },
                tableWidth: halfWidth,
                head: [["Affective Domain", "Rating"]],
                body: affective.map((t: any) => [t.name, String(t.score) + (t.remark ? ` (${t.remark})` : "")]),
                theme: "grid",
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 160, 133] },
            });
        }

        if (psychomotor.length) {
            autoTable(doc, {
                startY: domainStartY,
                margin: { left: margin + halfWidth + 12 },
                tableWidth: halfWidth,
                head: [["Psychomotor Domain", "Rating"]],
                body: psychomotor.map((t: any) => [t.name, String(t.score) + (t.remark ? ` (${t.remark})` : "")]),
                theme: "grid",
                styles: { fontSize: 8 },
                headStyles: { fillColor: [243, 156, 18] },
            });
        }

        const domainsY = ((doc as any).lastAutoTable?.finalY) ?? (domainStartY + 40);

        // --- Summary / comment section ---
        autoTable(doc, {
            startY: domainsY + 8,
            theme: "grid",
            head: [["Result Summary", ""]],
            body: [
                ["Total Subjects", String(subjects.length)],
                ["Total Score", row._raw?.totalScore != null ? String(row._raw.totalScore) : "-"],
                ["Average Score", row.average != null ? String(row.average) : "-"],
                ["Position in Class", row.overallPosition ?? "-"],
            ],
            styles: { fontSize: 9 },
            margin: { left: margin, right: margin },
            columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: "auto" } },
        });

        const commentY = ((doc as any).lastAutoTable?.finalY) ?? (domainsY + 80);

        // Comments / remarks
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Comments", margin, commentY + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        // teacher remark if present in raw
        const teacherRemark = row._raw?.formmasterRemark ?? "";
        const principalRemark = row._raw?.remark ?? "";
        doc.text(`Teacher: ${teacherRemark || "____________________________"}`, margin, commentY + 18);
        doc.text(`Principal: ${principalRemark || "____________________________"}`, margin, commentY + 28);

        // Keys
        doc.setFontSize(8);
        doc.text("Keys: A: Excellent, B: Very Good, C: Good, D: Fair, F: Fail", margin, commentY + 42);
        doc.text("Scores: 5: Excellent, 4: Very Good, 3: Good, 2: Fair, 1: Poor", margin, commentY + 48);

        // Footer timestamp & page number
        const footerY = doc.internal.pageSize.getHeight() - 12;
        doc.setFontSize(8);
        doc.text(`Generated: ${moment().format("DD MMM YYYY, HH:mm")}`, margin, footerY);
        doc.text(`Page ${idx + 1}/${total}`, pageWidth - margin, footerY, { align: "right" });

        return doc;
    };

    const generateCombinedPdf = async (rows: ReportCardRow[]) => {
        if (!rows.length) {
            show("warn", "No records", "There are no results to export.");
            return;
        }
        setProcessing(true);
        try {
            const doc = new jsPDF();
            for (let i = 0; i < rows.length; i++) {
                if (i > 0) doc.addPage();
                await buildStudentPdf(doc, rows[i], i, rows.length);
            }
            const filename = `${selectedClass || "report_cards"}_${selectedSession || "session"}_${selectedTerm || "term"}.pdf`.replace(/\s+/g, "_");
            doc.save(filename);
            show("success", "PDF ready", `Downloaded ${filename}`);
        } catch (err: any) {
            console.error("PDF generation error", err);
            show("error", "PDF error", err?.message ?? "Failed to generate PDF");
        } finally {
            setProcessing(false);
        }
    };

    const generateIndividualPdfBlobs = async (rows: ReportCardRow[]) => {
        const blobs: { name: string; blob: Blob }[] = [];
        for (let i = 0; i < rows.length; i++) {
            const doc = new jsPDF();
            await buildStudentPdf(doc, rows[i], i, rows.length);
            const pdfBlob = doc.output("blob");
            const filename = `${rows[i].studentName.replace(/\s+/g, "_")}_${rows[i].admissionnumber || ""}.pdf`;
            blobs.push({ name: filename, blob: pdfBlob });
        }
        return blobs;
    };

    const handleDownloadAllPdf = useCallback(async () => {
        if (!results || results.length === 0) {
            show("warn", "No records", "There are no results to export.");
            return;
        }
        await generateCombinedPdf(results);
    }, [results, show]);

    const handleDownloadZip = useCallback(async () => {
        if (!results || results.length === 0) {
            show("warn", "No records", "There are no results to export.");
            return;
        }
        setProcessing(true);
        try {
            const zip = new JSZip();
            const pdfs = await generateIndividualPdfBlobs(results);
            for (const p of pdfs) {
                zip.file(p.name, p.blob);
            }
            const content = await zip.generateAsync({ type: "blob" });
            const zipName = `${selectedClass || "report_cards"}_${selectedSession || "session"}_${selectedTerm || "term"}.zip`.replace(/\s+/g, "_");
            saveAs(content, zipName);
            show("success", "ZIP ready", `Downloaded ${zipName}`);
        } catch (err: any) {
            console.error("ZIP generation error", err);
            show("error", "ZIP error", err?.message ?? "Failed to generate ZIP");
        } finally {
            setProcessing(false);
        }
    }, [results, selectedClass, selectedSession, selectedTerm, show]);

    const handleDownloadSinglePdf = useCallback(
        async (row?: ReportCardRow) => {
            if (!row) return;
            setProcessing(true);
            try {
                const doc = new jsPDF();
                await buildStudentPdf(doc, row, 0, 1);
                const filename = `${row.studentName.replace(/\s+/g, "_")}_${row.admissionnumber || ""}.pdf`;
                doc.save(filename);
                show("success", "PDF ready", `Downloaded ${filename}`);
            } catch (err: any) {
                console.error("Single PDF error", err);
                show("error", "PDF error", err?.message ?? "Failed to generate PDF");
            } finally {
                setProcessing(false);
                panel.current?.hide();
            }
        },
        [show]
    );

    const contextMenuItems = useMemo(
        () => [
            { label: "View", icon: <FaEye className="inline-block mr-2" />, command: (r: ReportCardRow) => handleView(r) },
            { label: "Download PDF", icon: <AiOutlinePrinter className="inline-block mr-2" />, command: (r: ReportCardRow) => handleDownloadSinglePdf(r) },
            { label: "Delete", icon: <FaTrash className="inline-block mr-2" />, command: (r: ReportCardRow) => confirmDelete([r.id]) },
        ],
        [handleView, handleDownloadSinglePdf, confirmDelete]
    );

    const actionBody = useCallback(
        (row: ReportCardRow) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={(e) => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
            />
        ),
        []
    );

    const statusBody = useCallback(
        (row: ReportCardRow) => (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">{row.overallPosition ?? ""}</span>
        ),
        []
    );

    const onGlobalFilterChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
        setFilters({ global: { value: (e.target as HTMLInputElement).value, matchMode: FilterMatchMode.CONTAINS } });
    }, []);

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(loading || processing || deletingIds.length > 0 || updatingIds.length > 0) && (
                <Spinner visible onHide={() => { setLoading(false); setProcessing(false); setDeletingIds([]); setUpdatingIds([]); }} />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Student Results</h1>
                            <p className="text-sm text-gray-500">Results of the students of Habnaj International Schools.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {permitGenerate && (
                            <Button
                                label="Generate"
                                icon={<FaPlus />}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                                onClick={handleGenerate}
                                loading={processing}
                            />
                        )}
                    </div>
                </header>

                <div className="px-4 border-y border-gray-200 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Session</label>
                            <Dropdown value={selectedSession} options={sessionOptions} onChange={(e) => setSelectedSession(e.value)} placeholder="--- Select ---" className="w-full" showClear />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Term</label>
                            <Dropdown value={selectedTerm} options={termOptions} onChange={(e) => setSelectedTerm(e.value)} placeholder="--- Select ---" className="w-full" showClear />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <Dropdown value={selectedClass} options={classOptions} onChange={(e) => setSelectedClass(e.value)} placeholder="--- Select ---" className="w-full" showClear />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col">
                        <div className="w-full border-t border-gray-200 py-4 px-2">
                            <span className="p-input-icon-left block">
                                <i className="pi pi-search ml-2" />
                                <InputText placeholder="Search results..." onInput={onGlobalFilterChange} className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300" />
                            </span>
                        </div>

                        <div className="flex gap-2 mt-3">
                            {results && results.length > 0 && (
                                <>
                                    <Button label="Download PDF" icon={<AiOutlinePrinter />} onClick={() => handleDownloadAllPdf()} />
                                    <Button label="Download ZIP" icon={<AiOutlineFileZip />} onClick={() => handleDownloadZip()} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <DataTable
                        value={results}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        scrollable
                        scrollHeight="420px"
                        dataKey="id"
                        selectionMode="multiple"
                        selection={selected}
                        onSelectionChange={(e) => setSelected(e.value as ReportCardRow[])}
                        emptyMessage="No report cards found."
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                        <Column field="admissionnumber" header="Admission No." sortable />
                        <Column field="studentName" header="Student Name" sortable />
                        <Column field="average" header="Average" sortable />
                        <Column field="overallPosition" header="Class Position" body={statusBody} sortable />
                        <Column field="createdAt" header="Date" body={(row) => (row.createdAt ? moment(row.createdAt).format("DD MMM YYYY") : "")} />
                        <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                    </DataTable>
                </div>
            </div>

            {selected && selected.length > 0 && (
                <div className="mt-4">
                    <Button label={`Delete ${selected.length} report(s)`} icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDelete(selected.map((s) => s.id))} loading={deletingIds.length > 0} disabled={deletingIds.length > 0 || updatingIds.length > 0} />
                </div>
            )}

            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current && contextMenuItems.map((it) => (
                        <button key={it.label} className={`p-2 text-left w-full hover:bg-gray-100 border-0 bg-transparent flex items-center gap-2`} onClick={() => { it.command(current); panel.current?.hide(); }}>
                            {it.icon}
                            <span>{it.label}</span>
                        </button>
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Results;