"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useGetTerms } from "@/hooks/useTerms";

type SchoolClass = { id: string; name: string; section: string | null; studentCount: number };
type StudentRow = {
    id: string;
    admissionnumber: string;
    firstname: string;
    othername: string | null;
    surname: string;
    gender: string;
    active: boolean;
    enrollmentStatus: "ENROLLED" | "GRADUATED" | "WITHDRAWN";
    latestLifecycleStatus: string | null;
};

const lifecycleOptions = [
    { label: "Promote to another class", value: "PROMOTED" },
    { label: "Repeat current class", value: "REPEATED" },
    { label: "Transfer to another class", value: "TRANSFERRED" },
    { label: "Graduate", value: "GRADUATED" },
    { label: "Withdraw", value: "WITHDRAWN" },
    { label: "Re-enroll", value: "REENROLLED" },
];

const labelFor = (status: string) => lifecycleOptions.find((option) => option.value === status)?.label ?? status;
const todayAsLocalDate = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
};

export default function BulkStudentLifecycle() {
    const { data: session } = useSession();
    const { data: terms = [], isLoading: sessionsLoading, isError: sessionsError } = useGetTerms();
    const role = String(session?.user?.role ?? "").toLowerCase();
    const isTeacher = role === "teacher";
    const toast = useRef<Toast>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [classId, setClassId] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [operation, setOperation] = useState("PROMOTED");
    const [destinationClassId, setDestinationClassId] = useState("");
    const [schoolSession, setSchoolSession] = useState("");
    const [effectiveDate, setEffectiveDate] = useState(todayAsLocalDate);
    const [remark, setRemark] = useState("");
    const [search, setSearch] = useState("");
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState("");

    const sessionOptions = useMemo(() => Array.from(new Set(
        terms.map((term) => term.session?.trim()).filter((value): value is string => Boolean(value)),
    )).sort((a, b) => b.localeCompare(a)).map((value) => ({ label: value, value })), [terms]);

    const loadClasses = useCallback(async () => {
        setLoadingClasses(true);
        setError("");
        try {
            const response = await fetch("/api/student-lifecycle/classes", { credentials: "include", cache: "no-store" });
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(body?.error || "Could not load classes.");
            const rows = Array.isArray(body) ? body as SchoolClass[] : [];
            setClasses(rows);
            if (isTeacher && rows.length === 1) setClassId(rows[0].id);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not load classes.");
        } finally {
            setLoadingClasses(false);
        }
    }, [isTeacher]);

    const loadStudents = useCallback(async (selectedClassId: string) => {
        if (!selectedClassId) {
            setStudents([]);
            return;
        }
        setLoadingStudents(true);
        setSelectedIds([]);
        setError("");
        try {
            const response = await fetch(`/api/student-lifecycle/classes/${encodeURIComponent(selectedClassId)}/students`, { credentials: "include", cache: "no-store" });
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(body?.error || "Could not load students in this class.");
            setStudents(Array.isArray(body) ? body as StudentRow[] : []);
        } catch (cause) {
            setStudents([]);
            setError(cause instanceof Error ? cause.message : "Could not load students in this class.");
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    useEffect(() => { loadClasses(); }, [loadClasses]);
    useEffect(() => { loadStudents(classId); }, [classId, loadStudents]);

    const visibleStudents = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return students;
        return students.filter((student) => `${student.admissionnumber} ${student.firstname} ${student.othername ?? ""} ${student.surname}`.toLowerCase().includes(query));
    }, [students, search]);

    const isEligibleForOperation = (student: StudentRow, selectedOperation = operation) => selectedOperation === "REENROLLED"
        ? student.enrollmentStatus === "GRADUATED" || student.enrollmentStatus === "WITHDRAWN"
        : student.enrollmentStatus === "ENROLLED";
    const eligibleVisibleStudents = visibleStudents.filter((student) => isEligibleForOperation(student));

    const targetClassRequired = ["PROMOTED", "TRANSFERRED", "REENROLLED"].includes(operation);
    const destinationOptions = operation === "REENROLLED"
        ? classes
        : classes.filter((schoolClass) => schoolClass.id !== classId);
    const selectedStudents = students.filter((student) => selectedIds.includes(student.id));
    const sourceClass = classes.find((schoolClass) => schoolClass.id === classId);
    const destinationClass = classes.find((schoolClass) => schoolClass.id === destinationClassId);
    const canReview = selectedIds.length > 0
        && selectedIds.length <= 100
        && Boolean(classId)
        && Boolean(schoolSession.trim())
        && Boolean(effectiveDate)
        && remark.trim().length >= 10
        && (!targetClassRequired || Boolean(destinationClassId));

    const toggleStudent = (studentId: string) => {
        setSelectedIds((current) => current.includes(studentId)
            ? current.filter((id) => id !== studentId)
            : [...current, studentId]);
    };

    const toggleVisibleStudents = () => {
        const visibleIds = eligibleVisibleStudents.map((student) => student.id);
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
        setSelectedIds((current) => allVisibleSelected
            ? current.filter((id) => !visibleIds.includes(id))
            : [...new Set([...current, ...visibleIds])].slice(0, 100));
    };

    const applyOperation = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/student-lifecycle/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    sourceClassId: classId,
                    studentIds: selectedIds,
                    status: operation,
                    ...(targetClassRequired ? { toClassId: destinationClassId } : {}),
                    session: schoolSession,
                    effectiveDate: new Date(`${effectiveDate}T12:00:00.000Z`).toISOString(),
                    remark,
                }),
            });
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(body?.error || "The operation could not be completed.");
            setConfirmOpen(false);
            setSelectedIds([]);
            setRemark("");
            toast.current?.show({ severity: "success", summary: "Operation completed", detail: `${body.count} student record(s) updated.` });
            await loadStudents(classId);
            await loadClasses();
        } catch (cause) {
            toast.current?.show({ severity: "error", summary: "Operation failed", detail: cause instanceof Error ? cause.message : "The operation could not be completed." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="space-y-5 p-4 sm:p-6">
            <Toast ref={toast} />
            <header className="rounded-xl bg-white p-5 shadow-sm">
                <h1 className="text-2xl font-semibold text-gray-900">Bulk student lifecycle</h1>
                <p className="mt-1 text-sm text-gray-600">
                    {isTeacher ? "Choose your assigned class, select its students, and record a class or lifecycle operation." : "Choose a class, select students, and record one operation for the selected group."}
                </p>
            </header>

            <section className="rounded-xl bg-white p-5 shadow-sm">
                {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label htmlFor="lifecycle-class" className="mb-1 block text-sm font-medium">Class</label>
                        <Dropdown id="lifecycle-class" value={classId} options={classes} optionLabel="name" optionValue="id" onChange={(event) => { setClassId(event.value); setDestinationClassId(""); }} placeholder={loadingClasses ? "Loading classes…" : "Select class"} loading={loadingClasses} disabled={loadingClasses || classes.length === 0} className="w-full" />
                        {isTeacher && <small className="mt-1 block text-gray-500">Only classes assigned to you as form teacher are listed.</small>}
                    </div>
                    <div>
                        <label htmlFor="lifecycle-operation" className="mb-1 block text-sm font-medium">Operation</label>
                        <Dropdown id="lifecycle-operation" value={operation} options={lifecycleOptions} onChange={(event) => { setOperation(event.value); setDestinationClassId(""); setSelectedIds((current) => current.filter((id) => { const row = students.find((student) => student.id === id); return Boolean(row && isEligibleForOperation(row, event.value)); })); }} className="w-full" />
                    </div>
                    {targetClassRequired && (
                        <div>
                            <label htmlFor="lifecycle-destination" className="mb-1 block text-sm font-medium">Destination class</label>
                            <Dropdown id="lifecycle-destination" value={destinationClassId} options={destinationOptions} optionLabel="name" optionValue="id" onChange={(event) => setDestinationClassId(event.value)} placeholder="Select destination" className="w-full" disabled={!classId} />
                        </div>
                    )}
                    <div>
                        <label htmlFor="lifecycle-session" className="mb-1 block text-sm font-medium">School session</label>
                        <Dropdown id="lifecycle-session" value={schoolSession} options={sessionOptions} onChange={(event) => setSchoolSession(event.value ?? "")} placeholder={sessionsLoading ? "Loading sessions…" : "Select school session"} loading={sessionsLoading} disabled={sessionsLoading || sessionOptions.length === 0} className="w-full" />
                        {sessionsError && <small className="text-red-600">Could not load school sessions.</small>}
                        {!sessionsLoading && !sessionsError && sessionOptions.length === 0 && <small className="text-gray-500">Create a school term before recording a lifecycle operation.</small>}
                    </div>
                    <div>
                        <label htmlFor="lifecycle-date" className="mb-1 block text-sm font-medium">Effective date</label>
                        <InputText id="lifecycle-date" type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} className="w-full" />
                    </div>
                    <div className="md:col-span-2 xl:col-span-3">
                        <label htmlFor="lifecycle-remark" className="mb-1 block text-sm font-medium">Reason / note</label>
                        <InputTextarea id="lifecycle-remark" value={remark} onChange={(event) => setRemark(event.target.value)} rows={2} maxLength={1000} placeholder="Enter at least 10 characters. This note is saved in each selected student's history." className="w-full" />
                    </div>
                </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Select students</h2>
                        <p className="text-sm text-gray-600">{sourceClass?.name ?? "Select a class to show its students"} · {selectedIds.length} selected (maximum 100)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or admission number" disabled={!classId} />
                        <Button label="Select visible" outlined onClick={toggleVisibleStudents} disabled={!visibleStudents.length || loadingStudents} />
                        <Button label="Clear" text onClick={() => setSelectedIds([])} disabled={!selectedIds.length} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead><tr className="border-b bg-gray-50"><th className="p-3"><input aria-label="Select all eligible visible students" type="checkbox" checked={eligibleVisibleStudents.length > 0 && eligibleVisibleStudents.every((student) => selectedIds.includes(student.id))} onChange={toggleVisibleStudents} disabled={!eligibleVisibleStudents.length || loadingStudents} /></th><th className="p-3">Admission number</th><th className="p-3">Student</th><th className="p-3">Enrollment</th><th className="p-3">Account</th><th className="p-3">Last lifecycle operation</th></tr></thead>
                        <tbody>
                            {loadingStudents && <tr><td colSpan={6} className="p-5 text-center text-gray-500">Loading class roster…</td></tr>}
                            {!loadingStudents && !classId && <tr><td colSpan={6} className="p-5 text-center text-gray-500">Select a class to load students.</td></tr>}
                            {!loadingStudents && classId && students.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-gray-500">No students found in this class.</td></tr>}
                            {!loadingStudents && visibleStudents.map((student) => (
                                <tr key={student.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3"><input aria-label={`Select ${student.firstname} ${student.surname}`} type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleStudent(student.id)} disabled={(!selectedIds.includes(student.id) && selectedIds.length >= 100) || !isEligibleForOperation(student)} /></td>
                                    <td className="p-3">{student.admissionnumber}</td>
                                    <td className="p-3">{[student.firstname, student.othername, student.surname].filter(Boolean).join(" ")}</td>
                                    <td className="p-3"><span className={student.enrollmentStatus === "ENROLLED" ? "rounded bg-green-50 px-2 py-1 text-green-800" : "rounded bg-gray-100 px-2 py-1 text-gray-700"}>{student.enrollmentStatus.toLowerCase()}</span></td>
                                    <td className="p-3">{student.active ? "Sign-in enabled" : "Sign-in disabled"}</td>
                                    <td className="p-3">{student.latestLifecycleStatus ? labelFor(student.latestLifecycleStatus) : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button label={`Review ${labelFor(operation)}`} icon="pi pi-check" onClick={() => setConfirmOpen(true)} disabled={!canReview || saving} />
                </div>
            </section>

            <Dialog header="Review bulk operation" visible={confirmOpen} onHide={() => !saving && setConfirmOpen(false)} modal className="w-[95vw] max-w-xl">
                <div className="space-y-3 text-sm">
                    <p>You are about to <strong>{labelFor(operation).toLowerCase()}</strong> {selectedIds.length} student(s) in <strong>{sourceClass?.name}</strong>.</p>
                    {targetClassRequired && <p>Destination class: <strong>{destinationClass?.name || "Not selected"}</strong></p>}
                    <p>Session: <strong>{schoolSession}</strong> · Effective date: <strong>{effectiveDate}</strong></p>
                    <p>Reason: {remark}</p>
                    <div className="max-h-40 overflow-y-auto rounded border border-gray-200 p-3">
                        <p className="mb-2 font-medium">Selected students</p>
                        <ul className="list-inside list-disc">
                            {selectedStudents.map((student) => <li key={student.id}>{student.admissionnumber} — {[student.firstname, student.othername, student.surname].filter(Boolean).join(" ")}</li>)}
                        </ul>
                    </div>
                    <p className="rounded bg-amber-50 p-3 text-amber-900">The changes and a history entry will be saved together. If any selected student cannot be processed, none of the selected records will be changed.</p>
                    <div className="flex justify-end gap-2">
                        <Button label="Cancel" outlined onClick={() => setConfirmOpen(false)} disabled={saving} />
                        <Button label="Confirm operation" onClick={applyOperation} loading={saving} disabled={!canReview || saving} />
                    </div>
                </div>
            </Dialog>
        </main>
    );
}
