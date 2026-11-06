"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Spinner from "@/components/Spinner/Spinner";

/**
 * Types (lean)
 */
interface Student {
    id: string;
    firstname: string;
    othername?: string | null;
    surname: string;
    class: { id: string; name: string; category?: string };
}
interface Class {
    id: string;
    name: string;
    category?: string;
}
interface Trait {
    id: string;
    name: string;
    category: string;
    gradingpolicyId?: string;
}
interface Grading {
    id: string;
    title: string;
    session: string;
    term: string;
    published: boolean;
    gradingPolicyId?: string;
}
interface StudentTrait {
    id?: string;
    score: number;
    remark?: string;
    traitId: string;
    studentId: string;
    gradingId: string;
    createdAt?: string;
    updatedAt?: string;
}

/* ---------------------------
   Helper: fetch with error handling
   --------------------------- */
const fetchWithErrorHandling = async (url: string, controller?: AbortController) => {
    const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    return (data?.data ?? data) as any;
};

/* ---------------------------
   Small StarRating component (0..5)
   --------------------------- */
const StarRating: React.FC<{
    value: number;
    onChange: (v: number) => void;
    max?: number;
    size?: number;
    ariaLabel?: string;
}> = ({ value, onChange, max = 5, size = 18, ariaLabel }) => {
    const stars = Array.from({ length: max }, (_, i) => i + 1);
    return (
        <div role="radiogroup" aria-label={ariaLabel ?? "Rating"} className="inline-flex items-center gap-1">
            {stars.map((n) => (
                <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => onChange(n)}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, value - 1));
                        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(max, value + 1));
                    }}
                    className="focus:outline-none"
                    style={{ background: "transparent", border: "none", padding: 0, display: "inline-flex", alignItems: "center" }}
                >
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={n <= value ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.2"
                        className={n <= value ? "text-yellow-400" : "text-gray-300"}
                        aria-hidden
                    >
                        <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.402 8.167L12 18.896l-7.336 3.867 1.402-8.167L.132 9.209l8.2-1.191z" />
                    </svg>
                </button>
            ))}
            <span className="ml-2 text-xs text-gray-600">{value}</span>
        </div>
    );
};

/* ---------------------------
   Component
   --------------------------- */
const Traits: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const gradingId = (params?.id as string) ?? "";

    const toast = useRef<Toast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    const [grading, setGrading] = useState<Grading | null>(null);
    const [gradingPolicyTraits, setGradingPolicyTraits] = useState<Trait[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");

    // studentTrait map: traitId -> StudentTrait
    const [studentTraitRows, setStudentTraitRows] = useState<Record<string, StudentTrait>>({});

    /* ---------------------------
       Initial load: grading, classes, students
       --------------------------- */
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const load = async () => {
            if (!gradingId) {
                if (mounted) {
                    setLoading(false);
                    toast.current?.show({ severity: "error", summary: "Invalid grading", detail: "Grading ID missing." });
                }
                return;
            }
            try {
                if (mounted) setLoading(true);
                const [gradingResp, classesResp, studentsResp] = await Promise.all([
                    fetchWithErrorHandling(`/api/gradings/${gradingId}`, controller),
                    fetchWithErrorHandling("/api/classes", controller),
                    fetchWithErrorHandling("/api/students", controller),
                ]);

                if (!mounted) return;
                setGrading(gradingResp);
                setClasses(classesResp ?? []);
                setStudents(studentsResp ?? []);
                setFilteredStudents([]); // no class selected yet

                // load traits from grading policy if present
                if (gradingResp?.gradingPolicyId) {
                    try {
                        const policy = await fetchWithErrorHandling(`/api/policies/${gradingResp.gradingPolicyId}`, controller);
                        if (policy?.traits && Array.isArray(policy.traits)) {
                            setGradingPolicyTraits(policy.traits);
                        } else {
                            setGradingPolicyTraits([]);
                        }
                    } catch (err) {
                        console.warn("Could not load grading policy traits:", err);
                        setGradingPolicyTraits([]);
                    }
                }
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Initial load error:", err);
                if (mounted) toast.current?.show({ severity: "error", summary: "Load error", detail: err.message || "Failed to load data" });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void load();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [gradingId]);

    /* ---------------------------
       When class selected: filter students of that class
       --------------------------- */
    useEffect(() => {
        // Always clear UI state when class switches
        if (!selectedClassId) {
            setFilteredStudents([]);
            setSelectedStudentId("");
            setStudentTraitRows({});
            // ensure loading is false (no fetch in progress for this selection)
            setLoading(false);
            return;
        }
        const list = students.filter((s) => s.class?.id === selectedClassId);
        setFilteredStudents(list);
        setSelectedStudentId("");
        setStudentTraitRows({});
        // ensure any lingering loading state is cleared as we will wait for explicit student selection
        setLoading(false);
    }, [selectedClassId, students]);

    /* ---------------------------
       When student selected: load existing StudentTrait rows for that student
       GET /api/traits?gradingId=...&classId=...&studentId=...
       --------------------------- */
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const loadStudentTraits = async () => {
            // if no student or class or grading, clear and make sure loading is false then return
            if (!selectedStudentId || !selectedClassId || !gradingId) {
                if (mounted) {
                    setStudentTraitRows({});
                    setLoading(false);
                }
                return;
            }
            try {
                if (mounted) setLoading(true);
                const url = `/api/traits?gradingId=${encodeURIComponent(gradingId)}&classId=${encodeURIComponent(selectedClassId)}&studentId=${encodeURIComponent(selectedStudentId)}`;
                const rows: StudentTrait[] = await fetchWithErrorHandling(url, controller);
                if (!mounted) return;

                // convert array -> map by traitId
                const map: Record<string, StudentTrait> = {};
                for (const r of rows) {
                    map[r.traitId] = r;
                }

                // ensure every trait has an entry (default score 0) so UI shows all traits
                for (const trait of gradingPolicyTraits) {
                    if (!map[trait.id]) {
                        map[trait.id] = {
                            traitId: trait.id,
                            studentId: selectedStudentId,
                            gradingId,
                            score: 0,
                        } as StudentTrait;
                    }
                }

                setStudentTraitRows(map);
            } catch (err: any) {
                if (err?.name === "AbortError") {
                    // aborted: clear loading only if mounted
                    if (mounted) setLoading(false);
                    return;
                }
                console.error("Failed to load student traits:", err);
                if (mounted) toast.current?.show({ severity: "error", summary: "Load error", detail: err.message || "Failed to load student traits" });
                // create defaults if there's an error
                if (mounted) {
                    const map: Record<string, StudentTrait> = {};
                    for (const trait of gradingPolicyTraits) {
                        map[trait.id] = {
                            traitId: trait.id,
                            studentId: selectedStudentId,
                            gradingId,
                            score: 0,
                        } as StudentTrait;
                    }
                    setStudentTraitRows(map);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadStudentTraits();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [selectedStudentId, selectedClassId, gradingId, gradingPolicyTraits]);

    /* ---------------------------
       update a single trait score locally
       --------------------------- */
    const setTraitScore = (traitId: string, score: number) => {
        setStudentTraitRows((prev) => {
            const copy = { ...prev };
            const existing = copy[traitId] ?? {
                traitId,
                studentId: selectedStudentId,
                gradingId,
                score: 0,
            } as StudentTrait;
            existing.score = score;
            copy[traitId] = existing;
            return copy;
        });
    };

    /* ---------------------------
       Save all traits for the selected student
       POST /api/traits
       payload: { gradingId, classId, studentId, traits: [{ traitId, score, remark? }] }
       --------------------------- */
    const onSave = async () => {
        if (!selectedClassId) {
            toast.current?.show({ severity: "warn", summary: "Select class", detail: "Please select a class first." });
            return;
        }
        if (!selectedStudentId) {
            toast.current?.show({ severity: "warn", summary: "Select student", detail: "Please select a student first." });
            return;
        }

        const traitsPayload = Object.values(studentTraitRows).map((st) => ({
            traitId: st.traitId,
            score: Math.max(0, Math.min(5, Math.round(Number(st.score) || 0))),
            remark: st.remark ?? undefined,
        }));

        const payload = {
            gradingId,
            classId: selectedClassId,
            studentId: selectedStudentId,
            traits: traitsPayload,
        };

        try {
            setSaving(true);
            const res = await fetch("/api/traits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || `HTTP ${res.status}`);
            }

            const body = await res.json().catch(() => null);
            const returned: StudentTrait[] = (body?.data ?? body) || [];

            // map returned rows back into studentTraitRows
            const map: Record<string, StudentTrait> = {};
            for (const r of returned) {
                map[r.traitId] = r;
            }
            // ensure defaults for any missing trait
            for (const trait of gradingPolicyTraits) {
                if (!map[trait.id]) {
                    map[trait.id] = {
                        traitId: trait.id,
                        studentId: selectedStudentId,
                        gradingId,
                        score: 0,
                    } as StudentTrait;
                }
            }
            setStudentTraitRows(map);
            toast.current?.show({ severity: "success", summary: "Saved", detail: "Student traits saved successfully." });
        } catch (err: any) {
            console.error("Save traits error:", err);
            toast.current?.show({ severity: "error", summary: "Save error", detail: err.message || "Failed to save student traits." });
        } finally {
            setSaving(false);
        }
    };

    /* ---------------------------
       UI helpers
       --------------------------- */
    const classOptions = useMemo(() => classes.map((c) => ({ label: c.name, value: c.id })), [classes]);
    const studentOptions = useMemo(() => filteredStudents.map((s) => ({ label: `${s.firstname} ${s.othername ?? ""} ${s.surname}`.trim(), value: s.id })), [filteredStudents]);

    /* ---------------------------
       Render
       --------------------------- */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            <Spinner visible={saving} onHide={() => setSaving(false)} />

            <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold">{grading?.title ?? "Mark Traits"}</h2>
                <div className="flex gap-2">
                    <Button label="Save" className="bg-blue-600 text-white" onClick={onSave} disabled={saving || !selectedStudentId || !selectedClassId} />
                    <Button label="Back" className="bg-red-600 text-white" onClick={() => router.back()} />
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <Dropdown value={selectedClassId} options={classOptions} onChange={(e) => setSelectedClassId(e.value)} placeholder="Select class" className="w-full" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                        <Dropdown value={selectedStudentId} options={studentOptions} onChange={(e) => setSelectedStudentId(e.value)} placeholder="Select student" className="w-full" disabled={!selectedClassId} />
                    </div>

                    <div className="flex items-end">
                        <div className="text-sm text-gray-500">Total traits: <strong>{gradingPolicyTraits.length}</strong></div>
                    </div>
                </div>

                {selectedStudentId ? (
                    gradingPolicyTraits.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700 border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 border-b">Trait</th>
                                        <th className="px-4 py-3 border-b">Category</th>
                                        <th className="px-4 py-3 border-b">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gradingPolicyTraits.map((trait) => {
                                        const row = studentTraitRows[trait.id] ?? { traitId: trait.id, studentId: selectedStudentId, gradingId, score: 0 } as StudentTrait;
                                        const score = Number(row.score ?? 0);
                                        return (
                                            <tr key={trait.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 border-b border-gray-300 align-top">{trait.name}</td>
                                                <td className="px-4 py-3 border-b border-gray-300 align-top text-gray-600">{trait.category}</td>
                                                <td className="px-4 py-3 border-b border-gray-300 align-top">
                                                    <StarRating value={score} onChange={(v) => setTraitScore(trait.id, v)} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No traits configured for this grading policy.</p>
                    )
                ) : (
                    <p className="text-gray-500">Choose a class and student to mark traits.</p>
                )}
            </div>
        </section>
    );
};

export default Traits;
