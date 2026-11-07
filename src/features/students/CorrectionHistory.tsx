"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type CorrectionRecord = {
    id: string;
    reason: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    actorId: string;
    actorLabel: string;
    actorRole: string;
    createdAt: string;
};

const fieldLabels: Record<string, string> = {
    firstname: "First name",
    surname: "Surname",
    othername: "Other name",
    birthday: "Date of birth",
    gender: "Gender",
    parentid: "Linked guardian",
    title: "Title",
    bloodgroup: "Blood group",
    occupation: "Occupation",
    religion: "Religion",
    state: "State",
    lga: "LGA",
    phone: "Phone",
    address: "Address",
};

const displayValue = (value: unknown) => value == null || value === "" ? "—" : String(value);

export default function CorrectionHistory({ recordType, recordId }: { recordType: "STUDENT" | "PARENT"; recordId: string }) {
    const { data: session } = useSession();
    const canViewHistory = ["admin", "super", "management"].includes(String(session?.user?.role ?? "").toLowerCase());
    const [records, setRecords] = useState<CorrectionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!canViewHistory) return;
        const controller = new AbortController();
        setLoading(true);
        setError("");
        fetch(`/api/record-corrections?recordType=${recordType}&recordId=${encodeURIComponent(recordId)}`, {
            credentials: "include",
            signal: controller.signal,
        })
            .then(async (response) => {
                const body = await response.json().catch(() => null);
                if (!response.ok) throw new Error(body?.error || "Could not load correction history.");
                setRecords(Array.isArray(body) ? body : []);
            })
            .catch((cause: unknown) => {
                if (cause instanceof DOMException && cause.name === "AbortError") return;
                setError(cause instanceof Error ? cause.message : "Could not load correction history.");
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [recordType, recordId, canViewHistory]);

    if (!canViewHistory) return null;

    return (
        <section className="w-[96%] mx-auto mb-5 rounded-md border border-gray-200 bg-white p-4" aria-labelledby="correction-history-title">
            <h3 id="correction-history-title" className="text-lg font-semibold text-gray-900">Correction history</h3>
            <p className="mb-3 text-sm text-gray-600">Reasons and changed values are retained for staff review.</p>
            {loading && <p className="text-sm text-gray-600">Loading history…</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {!loading && !error && records.length === 0 && <p className="text-sm text-gray-600">No recorded corrections yet.</p>}
            <ol className="space-y-4">
                {records.map((record) => (
                    <li key={record.id} className="border-t border-gray-200 pt-3">
                        <p className="text-sm font-medium text-gray-900">
                            {new Date(record.createdAt).toLocaleString()} · {record.actorRole} — {record.actorLabel}
                        </p>
                        <p className="mt-1 text-sm"><strong>Reason:</strong> {record.reason}</p>
                        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                            {Object.keys(record.after).map((field) => (
                                <div key={field} className="rounded bg-gray-50 p-2 text-sm">
                                    <dt className="font-medium">{fieldLabels[field] || field}</dt>
                                    <dd className="text-gray-700">{displayValue(record.before[field])} <span aria-label="changed to">→</span> {displayValue(record.after[field])}</dd>
                                </div>
                            ))}
                        </dl>
                    </li>
                ))}
            </ol>
        </section>
    );
}
