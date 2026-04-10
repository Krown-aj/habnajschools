"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo
} from "react";

import { FaTrash, FaEye } from "react-icons/fa";
import { AiOutlinePrinter, AiOutlineFileZip } from "react-icons/ai";
import { Award } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import type {
    DataTableFilterMeta,
    DataTableFilterMetaData
} from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Spinner from "@/components/Spinner/Spinner";
import { getTeacherRemark, toOrdinal, parseOrdinal } from "@/lib/utils";
import { CONTACT } from "@/constants";

import { useGetTerms } from "@/hooks/useTerms";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */
type GradingDto = {
    id: string;
    title?: string;
    session?: string;
    term?: string;
    section: string;
};

type ClassDto = {
    id: string;
    name: string;
    section: string;
};

type ReportCardRow = {
    id?: string;
    studentId?: string;
    studentName?: string;
    admissionnumber?: string;
    class?: string;
    average?: number;
    overallPosition?: string;
    createdAt?: string;
    _raw?: any;
};

const PROFILE_PLACEHOLDER = "/assets/logo.png";

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */
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
    const [deletingIds, setDeletingIds] = useState<string[]>([]);

    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        } as DataTableFilterMetaData,
    });

    // Queries & mutations
    const {
        data: termsData = [],
        isPending: isPendingTerms,
        isError: isTermsError,
    } = useGetTerms();

    const role = session?.user?.role || "Guest";
    const parent = role?.toLocaleLowerCase() === "parent";

    const show = useCallback(
        (
            severity: "success" | "info" | "warn" | "error",
            summary: string,
            detail?: string
        ) => {
            toast.current?.show({
                severity,
                summary,
                detail,
                life: 4000
            });
        }, []);

    /* ---------------------------------------------------------------------- */
    /* OPTIONS                                                                */
    /* ---------------------------------------------------------------------- */
    const sessionOptions = useMemo(() => {
        const s = new Set<string>();
        for (const g of gradings) if (g.session) s.add(g.session);
        return Array.from(s).map((s) => ({ label: s, value: s }));
    }, [gradings]);

    const termOptions = useMemo(
        () => [
            { label: "1st Term", value: "First" },
            { label: "2nd Term", value: "Second" },
            { label: "3rd Term", value: "Third" },
        ],
        []
    );

    const classOptions = useMemo(
        () => classes.map((c) => ({ label: c.name, value: c.id })),
        [classes]);

    /* ---------------------------------------------------------------------- */
    /* INITIAL LOAD                                                           */
    /* ---------------------------------------------------------------------- */
    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            try {
                const classUrl =
                    role?.toLocaleLowerCase() === "parent"
                        ? `/api/classes?parentid=${session?.user.id}`
                        : "/api/classes";
                const gradingUrl = "/api/gradings";

                const [gRes, cRes] = await Promise.all([
                    fetch(gradingUrl, { signal: controller.signal }),
                    fetch(classUrl, { signal: controller.signal })]);

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

    /* ---------------------------------------------------------------------- */
    /* FETCH RESULTS                                                          */
    /* ---------------------------------------------------------------------- */
    const findGrading = useCallback(() => {
        if (!selectedSession || !selectedTerm || !selectedClass) return undefined;

        const selectedCls = classes.find(c => c.id === selectedClass);
        if (!selectedCls?.section) return undefined;
        const section = selectedCls?.section?.toLocaleLowerCase();
        const selectedSection = section === 'nursery' ? 'primary' : section;
        return gradings.find(g =>
            g.session === selectedSession &&
            g.term === selectedTerm &&
            g.section?.toLocaleLowerCase() === selectedSection
        );
    }, [
        gradings,
        classes,
        selectedClass,
        selectedSession,
        selectedTerm,
    ]);


    const transformApiPayloadToRows = useCallback((payload: any): ReportCardRow[] => {
        if (!Array.isArray(payload) || payload.length === 0) return [];
        const selectedCls = classes.find(c => c.id === selectedClass);
        const section = selectedCls?.section?.toLocaleLowerCase();
        let classObj = payload[0];
        if (selectedClass) {
            const found = payload.find((p: any) => p.class?.id === selectedClass);
            if (found) classObj = found;
        }

        const currentTerm = termsData.find(t => t.session === selectedSession && t.term === selectedTerm)
        const nextTermBegin = currentTerm?.nextterm

        const rows: ReportCardRow[] = (classObj?.gradings ?? []).map((g: any, i: number) => ({
            id: `${classObj?.class?.id || "c"}_${g.admissionnumber || i}`,
            studentId: g.studentId ?? undefined,
            studentName: `${g.firstname ?? ""} ${g.othername ?? ""} ${g.surname ?? ""}`.trim(),
            admissionnumber: g.admissionnumber ?? "",
            class: classObj?.class?.name ?? "",
            average: typeof g.grades?.averageScore === "number" ? Number(Number(g.grades.averageScore).toFixed(2)) : (g.grades?.average ? Number(Number(g.grades.average).toFixed(2)) : undefined),
            overallPosition: g.grades?.classPosition ?? undefined,
            createdAt: g.createdAt ?? undefined,
            _raw: { class: classObj?.class, session: classObj?.session, section: section, term: classObj?.term, nexttime: nextTermBegin ?? null, gradingEntry: g, grading: classObj?.grading ?? undefined },
        }));

        rows.sort((a, b) => parseOrdinal(a.overallPosition) - parseOrdinal(b.overallPosition));
        return rows;
    }, [selectedClass, selectedTerm, selectedSession]);

    useEffect(() => {
        let mounted = true;
        if (!selectedSession || !selectedTerm || !selectedClass) {
            setResults([]);
            return;
        }
        const grading = findGrading();
        if (!grading) {
            setResults([]);
            show("warn", "Grading Not Found", "No result has been published for the selected session and term!");
            return;
        }

        const controller = new AbortController();
        const fetchResults = async () => {
            setLoading(true);
            try {
                const url = `/api/results?gradingId=${encodeURIComponent(grading.id)}&classId=${encodeURIComponent(selectedClass)}`;
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.error || `Status ${res.status}`);
                }
                const body = await res.json();
                const payload = body?.data ?? body;
                if (!mounted) return;
                const rows = transformApiPayloadToRows(payload);
                setResults(rows);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                show("error", "Fetch Error", err.message || "Failed to fetch results");
                setResults([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchResults();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [selectedSession, selectedTerm, selectedClass, findGrading, show, transformApiPayloadToRows]);

    const formatDate = (date?: string | null) => {
        if (!date) return "-";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const deleteApi = useCallback(async (ids: string[]) => {
        const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/results?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || `Status ${res.status}`);
        }
        return res;
    }, []);

    const confirmDelete = useCallback((ids: string[]) => {
        if (!ids.length) return;
        if (!confirm(`Delete ${ids.length} report card(s)? This action cannot be undone.`)) return;
        setDeletingIds(ids);
        deleteApi(ids)
            .then(() => {
                show("success", "Deleted", `${ids.length} report card(s) deleted`);
                setResults((prev) => prev.filter((r) => !ids.includes(r.id!)));
                setSelected((prev) => prev.filter((r) => !ids.includes(r.id!)));
            })
            .catch((err: any) => show("error", "Delete error", err.message || "Failed to delete"))
            .finally(() => setDeletingIds([]));
    }, [deleteApi, show]);

    const handleView = useCallback((row: ReportCardRow) => {
        const grading = findGrading();
        if (!grading?.id || !row.studentId || !selectedClass || !selectedSession || !selectedTerm) return;
        router.push(`/dashboard/${role}/results/${encodeURIComponent(grading.id)}&studentId=${encodeURIComponent(row.studentId)}&classId=${encodeURIComponent(selectedClass)}&session=${encodeURIComponent(selectedSession)}&term=${encodeURIComponent(selectedTerm)}/view`);
        panel.current?.hide();
    }, [router, role, selectedTerm, selectedClass, selectedSession]);

    //Utility: convert image URL to based64
    const getBase64ImageFromUrl = useCallback(async (url?: string | null, place_holder?: string | null) => {
        const safeUrl = url && String(url).trim() ? url : place_holder;
        try {
            if (!safeUrl) return null;
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

    // normalize assessment label
    const normalizeAssessmentName = useCallback((raw: any) => (String(raw ?? "").trim().toUpperCase()), []);

    // compute union-of-assessments (normalized) preserving first-seen order
    const assessmentCols = useMemo(() => {
        const cols: string[] = [];
        for (const r of results) {
            const gradingEntry = r._raw?.gradingEntry;
            if (!gradingEntry) continue;
            const subjects = gradingEntry?.grades?.subjects ?? [];
            for (const s of subjects) {
                for (const a of (s.assessments ?? [])) {
                    const nm = normalizeAssessmentName(a?.name);
                    if (!nm) continue;
                    if (!cols.includes(nm)) cols.push(nm);
                }
            }
        }
        return cols;
    }, [results, normalizeAssessmentName]);

    // subject stats across class: avg, min, max
    const subjectStats = useMemo(() => {
        const map = new Map<string, { sum: number; count: number; min: number; max: number }>();
        for (const r of results) {
            const gradingEntry = r._raw?.gradingEntry;
            if (!gradingEntry) continue;
            const subjects = gradingEntry?.grades?.subjects ?? [];
            for (const s of subjects) {
                const name = String(s.name ?? "").trim();
                if (!name) continue;
                const score = typeof s.score === "number" ? s.score : (s.score ? Number(s.score) : NaN);
                const curr = map.get(name) ?? { sum: 0, count: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
                if (!Number.isNaN(score)) {
                    curr.sum += score;
                    curr.count += 1;
                    curr.min = Math.min(curr.min, score);
                    curr.max = Math.max(curr.max, score);
                }
                map.set(name, curr);
            }
        }
        const out = new Map<string, { avg: number | null; min: number | null; max: number | null; count: number }>();
        for (const [k, v] of map.entries()) {
            if (v.count === 0) out.set(k, { avg: null, min: null, max: null, count: 0 });
            else out.set(k, { avg: Number((v.sum / v.count).toFixed(2)), min: Number(v.min.toFixed(2)), max: Number(v.max.toFixed(2)), count: v.count });
        }
        return out;
    }, [results]);

    // Build subject rows aligned to provided normalized assessmentCols and using subjectStats
    const buildSubjectRowsFromEntry = useCallback((gradingEntry: any, assessmentColsNormalized: string[], subjectStatsMap: Map<string, { avg: number | null; min: number | null; max: number | null; count: number }>) => {
        const subjects = gradingEntry?.grades?.subjects ?? [];
        return subjects.map((s: any) => {
            const am = new Map<string, number | null>();
            (s.assessments ?? []).forEach((a: any) => {
                const n = normalizeAssessmentName(a?.name);
                am.set(n, a?.score ?? null);
            });
            const assessmentValues = assessmentColsNormalized.map((col) => (am.has(col) ? am.get(col) : null));
            const stats = subjectStatsMap.get(String(s.name ?? "").trim()) ?? { avg: null, min: null, max: null, count: 0 };
            // convert subject position to ordinal (if available)
            const rawPos = s.subjectPosition ?? s.position ?? undefined;
            const positionOrdinal = rawPos != null ? toOrdinal(rawPos) : "-";
            return {
                subjectName: s.name ?? "",
                assessments: assessmentValues,
                total: typeof s.score === "number" ? s.score : (s.score ? Number(s.score) : null),
                grade: s.grade ?? "",
                remark: s.remark ?? "",
                position: positionOrdinal,
                min: stats.min,
                max: stats.max,
                avg: stats.avg,
            };
        });
    }, [normalizeAssessmentName]);

    // group traits by uppercase category
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

    // teacher remark generator (rounded average used)
    const generateTeacherRemark = useCallback((average: number | undefined | null) => getTeacherRemark(average), []);

    /* ---------------------------------------------------------------------- */
    /* PDF GENERATION                                                         */
    /* ---------------------------------------------------------------------- */
    const buildStudentPdf = useCallback(
        async (doc: jsPDF, row: ReportCardRow, idx: number, total: number, sharedAssessmentCols: string[], subjectStatsMap: Map<string, { avg: number | null; min: number | null; max: number | null; count: number }>, studentCount: number) => {
            const margin = 8;
            const pageWidth = doc.internal.pageSize.getWidth();
            const section = row._raw?.section?.toLocaleLowerCase();

            /* ---------------------------- HEADER ---------------------------- */
            // Logo section
            const logoSize = 20;
            const avatarUrl = row._raw?.gradingEntry?.avarta ?? row._raw?.gradingEntry?.student?.avarta ?? PROFILE_PLACEHOLDER;
            const logoUrl = "/assets/logo.png";
            const [logoB64, avatarB64] = await Promise.all([getBase64ImageFromUrl(logoUrl, PROFILE_PLACEHOLDER), getBase64ImageFromUrl(avatarUrl, PROFILE_PLACEHOLDER)]);

            if (logoB64) try { doc.addImage(logoB64, "PNG", margin, 8, logoSize, logoSize); } catch { }
            if (avatarB64) try { doc.addImage(avatarB64, "PNG", pageWidth - margin - logoSize, 8, logoSize, logoSize); } catch { }

            // School name and addresses
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("HABNAJ INTERNATIONAL SCHOOLS", pageWidth / 2, 18, { align: "center" });
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("Plot D 12, Sam Njoma Street, GRA Bauchi, Bauchi State.", pageWidth / 2, 24, { align: "center" });
            doc.text(`Email: ${CONTACT.email}, Phone: ${CONTACT.phone}`, pageWidth / 2, 28, { align: "center" });

            doc.setLineWidth(0.4);
            doc.line(margin, 34, pageWidth - margin, 34);

            /* ---------------------------- STUDENT INFO TABLE ---------------------------- */
            const gradingEntry = row._raw?.gradingEntry ?? {};
            const term = row._raw?.term ?? row._raw?.grading?.term ?? selectedTerm;
            const session = row._raw?.session ?? row._raw?.grading?.session ?? selectedSession;
            /* const nextTermBegins = gradingEntry?.nextTermBegins ?? "May 11, 2026"; */
            const nextTermBegins = formatDate(
                row._raw?.nexttime ??
                row._raw?.grading?.term?.nexttime
            );
            const infoStartY = 36;
            autoTable(doc, {
                startY: infoStartY,
                theme: "grid",
                head: [["Student", "Admission No.", "Class", "Term", "Session", "Next Term Begins"]],
                body: [[row.studentName?.toLocaleUpperCase() ?? "-", row.admissionnumber ?? "-", row.class ?? "-", String(term ?? "-"), String(session ?? "-"), String(nextTermBegins ?? "-")]],
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

            /* ----------------------- SUBJECT TABLE -------------------------- */
            const infoY = (doc as any).lastAutoTable?.finalY;
            const assessmentColumns = sharedAssessmentCols;
            const subjectRows = buildSubjectRowsFromEntry(gradingEntry, assessmentColumns, subjectStatsMap);

            const head = [["Subject", ...assessmentColumns, "Total", "Avg.", "Min.", "Max.", "Position", "Grade", "Remark"]];
            const body = subjectRows.map((s: any) => {
                const assessmentCells = (s.assessments ?? []).map((v: any) => (v != null ? String(v) : "-"));
                for (let i = assessmentCells.length; i < assessmentColumns.length; i++) assessmentCells.push("-");
                const avgClass = s.avg != null ? Number(s.avg).toFixed(2) : "-";
                const minClass = s.min != null ? Number(s.min).toFixed(2) : "-";
                const maxClass = s.max != null ? Number(s.max).toFixed(2) : "-";
                return [
                    s.subjectName ?? "",
                    ...assessmentCells,
                    s.total != null ? String(s.total) : "-",
                    avgClass,
                    minClass,
                    maxClass,
                    s.position ?? "-",
                    s.grade ?? "-",
                    s.remark ?? "-",
                ];
            });

            if (body.length > 0) {
                autoTable(doc, {
                    startY: infoY + 4,
                    head,
                    body,
                    theme: "grid",
                    styles: { fontSize: 7, cellPadding: 2 },
                    margin: { left: margin, right: margin },
                    headStyles: { fillColor: [22, 160, 133] },
                    columnStyles: { 0: { cellWidth: 40 } },
                });
            }

            //const cognitiveY = (doc as any).lastAutoTable?.finalY ?? (infoY + 90);
            const cognitiveY = (doc as any).lastAutoTable?.finalY + 4;

            /* ---------------- DOMAINS (TRAITS) + SUMMARY  ------------------ */
            const domains: { title: string; rows: any[], color: [number, number, number] }[] = []

            const traitGroups = groupTraitsByCategory(gradingEntry);
            const affective = traitGroups["AFFECTIVE"] ?? [];
            const psychomotor = traitGroups["PSYCHOMOTOR"] ?? [];
            const behavioural = traitGroups["BEHAVIOURAL"] ?? traitGroups["BEHAVIORAL"] ?? [];

            // Collect available domains in preferred order to position side-by-side
            const availableDomains: Array<{ key: string; label: string; items: any[] }> = [];
            if (affective.length) availableDomains.push({ key: "AFFECTIVE", label: "Affective domain", items: affective });
            if (psychomotor.length) availableDomains.push({ key: "PSYCHOMOTOR", label: "Psychomotive Domain", items: psychomotor });
            if (behavioural.length) availableDomains.push({ key: "BEHAVIOURAL", label: "Behavioural domain", items: behavioural });

            if (affective.length)
                domains.push({
                    title: "Affective Domain",
                    rows: affective.map((t: any) => [
                        t.name,
                        t.score
                    ]),
                    color: [22, 160, 133]
                });
            if (psychomotor.length)
                domains.push({
                    title: "Psychomotor Domain",
                    rows: psychomotor.map((t: any) => [
                        t.name,
                        t.score
                    ]),
                    color: [52, 152, 219]
                });
            if (behavioural.length)
                domains.push({
                    title: "Behavioural Domain",
                    rows: behavioural.map((t: any) => [
                        t.name,
                        t.score
                    ]),
                    color: [30, 64, 175]
                });

            if (section === "nursery" || section === "primary") {
                domains.push({
                    title: "Result Summary",
                    rows: [
                        ["Students in Class", studentCount],
                        ["Class Position", String(gradingEntry?.grades?.classPosition ?? row.overallPosition ?? "-")],
                        ["Total Score", String(gradingEntry?.grades?.totalScore ?? "-")],
                        ["Average Score", gradingEntry?.grades?.averageScore != null ? String(Number(gradingEntry.grades.averageScore).toFixed(2)) : (row.average != null ? String(Number(row.average).toFixed(2)) : "-")],
                    ],
                    color: [41, 128, 185]
                });
            } else {
                domains.push({
                    title: "Result Summary",
                    rows: [
                        /* ["Students in Class", studentCount],
                        ["Class Position", String(gradingEntry?.grades?.classPosition ?? row.overallPosition ?? "-")], */
                        ["Total Score", String(gradingEntry?.grades?.totalScore ?? "-")],
                        ["Average Score", gradingEntry?.grades?.averageScore != null ? String(Number(gradingEntry.grades.averageScore).toFixed(2)) : (row.average != null ? String(Number(row.average).toFixed(2)) : "-")],
                    ],
                    color: [41, 128, 185]
                });
            }

            const count = domains.length;
            const gap = 6;
            const width =
                (pageWidth - margin * 2 - gap * (count - 1)) /
                count;
            domains.forEach((d, i) => {
                autoTable(doc, {
                    startY: cognitiveY,
                    margin: {
                        left: margin + i * (width + gap)
                    },
                    tableWidth: width,
                    head: [[d.title, ""]],
                    body: d.rows,
                    styles: {
                        fontSize: 7,
                        cellPadding: 3
                    },
                    headStyles: { fillColor: d.color },
                    theme: "grid"
                });
            });




            const commentStartY = (doc as any).lastAutoTable?.finalY + 4;
            // Comments table
            const principalRemark = gradingEntry?.grades?.remark ?? "";
            const teacherGeneratedRemark = generateTeacherRemark(row.average);

            autoTable(doc, {
                startY: commentStartY + 45,
                theme: "grid",
                head: [["Remarker", "Remark"]],
                body: [
                    ["Principal", principalRemark || "Principal's comment here..."],
                    ["Class Teacher", teacherGeneratedRemark],
                ],
                styles: { fontSize: 7, cellPadding: 2 },
                margin: { left: margin, right: margin },
                headStyles: { fillColor: [41, 128, 185] },
            });

            // Keys and footer placed inside page bounds
            const footerBase = doc.internal.pageSize.getHeight() - 15;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.text('Keys: A: Excellent, B: Very Good, C: Good, D: Pass, F: Fail', margin, footerBase);
            doc.text('Keys: 5: Excellent, 4: Very Good, 3: Good, 2: Pass, 1: Poor', margin, footerBase + 5);

            /* const footerY = doc.internal.pageSize.getHeight() - 12;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${moment().format("DD MMM YYYY, HH:mm")}`, margin, footerY); */

            return doc;
        }, [buildSubjectRowsFromEntry, getBase64ImageFromUrl, groupTraitsByCategory, generateTeacherRemark, selectedSession, selectedTerm]);

    const generateCombinedPdf = useCallback(async (rows: ReportCardRow[]) => {
        if (!rows.length) {
            show("warn", "No records", "There are no results to export.");
            return;
        }
        setProcessing(true);
        try {
            // compute shared normalized assessment columns (first-seen)
            const sharedCols: string[] = [];
            for (const r of rows) {
                const gradingEntry = r._raw?.gradingEntry;
                if (!gradingEntry) continue;
                for (const s of gradingEntry?.grades?.subjects ?? []) {
                    for (const a of (s.assessments ?? [])) {
                        const nm = normalizeAssessmentName(a?.name);
                        if (!nm) continue;
                        if (!sharedCols.includes(nm)) sharedCols.push(nm);
                    }
                }
            }
            const subjectStatsMap = subjectStats;
            const studentCount = rows.length;

            const doc = new jsPDF();
            for (let i = 0; i < rows.length; i++) {
                if (i > 0) doc.addPage();
                // eslint-disable-next-line no-await-in-loop
                await buildStudentPdf(doc, rows[i], i, rows.length, sharedCols, subjectStatsMap, studentCount);
            }
            const className = classes.find(c => c.id === selectedClass)?.name
            const filename = `${className || "report_cards"}_${selectedSession || "session"}_${selectedTerm || "term"}.pdf`.replace(/\s+/g, "_");
            doc.save(filename);
            show("success", "PDF ready", `Downloaded ${filename}`);
        } catch (err: any) {
            console.error("PDF generation error", err);
            show("error", "PDF error", err?.message ?? "Failed to generate PDF");
        } finally {
            setProcessing(false);
        }
    }, [buildStudentPdf, normalizeAssessmentName, subjectStats, selectedClass, classes, selectedSession, selectedTerm, show]);

    const generateIndividualPdfBlobs = useCallback(async (rows: ReportCardRow[]) => {
        const blobs: { name: string; blob: Blob }[] = [];
        // compute shared normalized assessment cols once
        const sharedCols: string[] = [];
        for (const r of rows) {
            const gradingEntry = r._raw?.gradingEntry;
            if (!gradingEntry) continue;
            for (const s of gradingEntry?.grades?.subjects ?? []) {
                for (const a of (s.assessments ?? [])) {
                    const nm = normalizeAssessmentName(a?.name);
                    if (!nm) continue;
                    if (!sharedCols.includes(nm)) sharedCols.push(nm);
                }
            }
        }
        const subjectStatsMap = subjectStats;
        const studentCount = rows.length;
        for (let i = 0; i < rows.length; i++) {
            const doc = new jsPDF();
            // eslint-disable-next-line no-await-in-loop
            await buildStudentPdf(doc, rows[i], i, rows.length, sharedCols, subjectStatsMap, studentCount);
            const pdfBlob = doc.output("blob");
            const filename = `${(rows[i].studentName || "student").replace(/\s+/g, "_")}_${rows[i].admissionnumber || ""}.pdf`;
            blobs.push({ name: filename, blob: pdfBlob });
        }
        return blobs;
    }, [buildStudentPdf, normalizeAssessmentName, subjectStats]);

    const handleDownloadAllPdf = useCallback(async () => {
        if (!results || results.length === 0) {
            show("warn", "No records", "There are no results to export.");
            return;
        }
        await generateCombinedPdf(results);
    }, [results, generateCombinedPdf, show]);

    const handleDownloadZip = useCallback(async () => {
        if (!results || results.length === 0) {
            show("warn", "No records", "There are no results to export.");
            return;
        }
        setProcessing(true);
        try {
            const zip = new JSZip();
            const pdfs = await generateIndividualPdfBlobs(results);
            for (const p of pdfs) zip.file(p.name, p.blob);
            const content = await zip.generateAsync({ type: "blob" });
            const className = classes.find(c => c.id === selectedClass)?.name
            const zipName = `${className || "report_cards"}_${selectedSession || "session"}_${selectedTerm || "term"}.zip`.replace(/\s+/g, "_");
            saveAs(content, zipName);
            show("success", "ZIP ready", `Downloaded ${zipName}`);
        } catch (err: any) {
            console.error("ZIP generation error", err);
            show("error", "ZIP error", err?.message ?? "Failed to generate ZIP");
        } finally {
            setProcessing(false);
        }
    }, [results, selectedClass, classes, selectedSession, selectedTerm, generateIndividualPdfBlobs, show]);

    const handleDownloadSinglePdf = useCallback(async (row?: ReportCardRow) => {
        if (!row) return;
        setProcessing(true);
        try {
            // compute shared cols from current results
            const sharedCols: string[] = [];
            for (const r of results) {
                const gradingEntry = r._raw?.gradingEntry;
                if (!gradingEntry) continue;
                for (const s of gradingEntry?.grades?.subjects ?? []) {
                    for (const a of (s.assessments ?? [])) {
                        const nm = normalizeAssessmentName(a?.name);
                        if (!nm) continue;
                        if (!sharedCols.includes(nm)) sharedCols.push(nm);
                    }
                }
            }
            const subjectStatsMap = subjectStats;
            const studentCount = results.length;

            const doc = new jsPDF();
            await buildStudentPdf(doc, row, 0, 1, sharedCols, subjectStatsMap, studentCount);
            const filename = `${(row.studentName || "student").replace(/\s+/g, "_")}_${row.admissionnumber || ""}.pdf`;
            doc.save(filename);
            show("success", "PDF ready", `Downloaded ${filename}`);
        } catch (err: any) {
            console.error("Single PDF error", err);
            show("error", "PDF error", err?.message ?? "Failed to generate PDF");
        } finally {
            setProcessing(false);
            panel.current?.hide();
        }
    }, [buildStudentPdf, normalizeAssessmentName, results, show, subjectStats]);

    const contextMenuItems = useMemo(() => {
        if (parent) {
            return [
                { label: "Download PDF", icon: <AiOutlinePrinter className="inline-block mr-2" />, command: (r: ReportCardRow) => handleDownloadSinglePdf(r) },
            ]
        }
        return [
            { label: "View", icon: <FaEye className="inline-block mr-2" />, command: (r: ReportCardRow) => handleView(r) },
            { label: "Download PDF", icon: <AiOutlinePrinter className="inline-block mr-2" />, command: (r: ReportCardRow) => handleDownloadSinglePdf(r) },
            { label: "Delete", icon: <FaTrash className="inline-block mr-2" />, command: (r: ReportCardRow) => confirmDelete([r.id!]) },
        ]
    }, [handleView, handleDownloadSinglePdf, confirmDelete, parent]);

    const actionBody = useCallback((row: ReportCardRow) => (
        <Button
            icon="pi pi-ellipsis-v"
            className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
            onClick={(e) => {
                setCurrent(row);
                panel.current?.toggle(e);
            }}
        />
    ), []);

    const statusBody = useCallback((row: ReportCardRow) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">{row.overallPosition ?? ""}</span>
    ), []);

    const onGlobalFilterChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
        setFilters({ global: { value: (e.target as HTMLInputElement).value, matchMode: FilterMatchMode.CONTAINS } });
    }, []);

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(loading || processing || deletingIds.length > 0) && (
                <Spinner visible onHide={() => { setLoading(false); setProcessing(false); setDeletingIds([]); }} />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Student Results</h1>
                            <p className="text-sm text-gray-500">Results of the students of Habnaj Internatinal Schools.</p>
                        </div>
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
                            {(results && results.length > 0 && !parent) && (
                                <>
                                    <Button label="Download PDF" icon={<AiOutlinePrinter />} onClick={() => handleDownloadAllPdf()} loading={processing} />
                                    <Button label="Download ZIP" icon={<AiOutlineFileZip />} onClick={() => handleDownloadZip()} loading={processing} />
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
                        <Column field="average" header="Average" sortable body={(r) => (r.average != null ? Number(r.average).toFixed(2) : "-")} />
                        {!parent && <Column field="overallPosition" header="Class Position" body={statusBody} sortable />}
                        {/* <Column field="createdAt" header="Date" body={(row: ReportCardRow) => (row.createdAt ? moment(row.createdAt).format("DD MMM YYYY") : "")} /> */}
                        <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                    </DataTable>
                </div>
            </div>

            {selected && selected.length > 0 && (
                <div className="mt-4">
                    <Button label={`Delete ${selected.length} report(s)`} icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDelete(selected.map((s) => s.id!))} loading={deletingIds.length > 0} disabled={deletingIds.length > 0} />
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
