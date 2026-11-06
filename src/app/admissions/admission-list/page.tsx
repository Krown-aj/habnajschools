"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaDownload, FaSearch } from "react-icons/fa";
import Link from "next/link";

type Section = "All" | "Nursery" | "Primary" | "Junior" | "Senior";

type Applicant = {
    id: string;
    name: string;
    section: Exclude<Section, "All">;
    score?: number | null;
    status: "Admitted" | "Waitlist" | "Not Admitted";
};

// Demo data (replace with real data from API)
const DEMO_DATA: Applicant[] = [
    { id: "APP-2025-001", name: "Aisha Bello", section: "Nursery", score: null, status: "Admitted" },
    { id: "APP-2025-002", name: "Tunde Okonkwo", section: "Primary", score: 82, status: "Admitted" },
    { id: "APP-2025-003", name: "Grace Uche", section: "Junior", score: 76, status: "Waitlist" },
    { id: "APP-2025-004", name: "Emeka Nnamdi", section: "Senior", score: 88, status: "Admitted" },
    { id: "APP-2025-005", name: "Zainab Ibrahim", section: "Primary", score: 68, status: "Not Admitted" },
    { id: "APP-2025-006", name: "Chiamaka Obi", section: "Junior", score: 79, status: "Admitted" },
    { id: "APP-2025-007", name: "Maryam Ali", section: "Nursery", score: null, status: "Admitted" },
    { id: "APP-2025-008", name: "Samuel Peter", section: "Senior", score: 81, status: "Waitlist" },
    { id: "APP-2025-009", name: "Ruth Johnson", section: "Primary", score: 74, status: "Admitted" },
    { id: "APP-2025-010", name: "Ibrahim Musa", section: "Junior", score: 70, status: "Not Admitted" },
    // add more items to demo pagination
    ...Array.from({ length: 26 }).map((_, i) => {
        const randomValue = Math.random();
        const status: Applicant['status'] = randomValue > 0.7 ? "Waitlist" : randomValue > 0.3 ? "Admitted" : "Not Admitted";
        return {
            id: `APP-2025-${100 + i}`,
            name: `Demo Student ${i + 1}`,
            section: (i % 4 === 0 ? "Nursery" : i % 4 === 1 ? "Primary" : i % 4 === 2 ? "Junior" : "Senior") as Exclude<Section, "All">,
            score: Math.round(60 + Math.random() * 40),
            status,
        };
    }),
];

const sections: Section[] = ["All", "Nursery", "Primary", "Junior", "Senior"];

const rowVariant = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
};

export default function CheckAdmissionList() {
    const [section, setSection] = useState<Section>("All");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return DEMO_DATA.filter((a) => {
            const matchesSection = section === "All" ? true : a.section === section;
            const matchesQuery = q
                ? a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.status.toLowerCase().includes(q)
                : true;
            return matchesSection && matchesQuery;
        });
    }, [section, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const pageData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    function exportCSV(list: Applicant[]) {
        if (!list.length) return;
        const header = ["Application ID", "Name", "Section", "Score", "Status"];
        const rows = list.map((r) => [r.id, r.name, r.section, r.score ?? "-", r.status]);
        const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `admission-list-${section.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Reset page when filter changes
    React.useEffect(() => setPage(1), [section, query]);

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="sr-only">Search</label>
                    <div className="relative w-full sm:w-80">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, application ID or status"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                        {sections.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSection(s)}
                                className={`px-3 py-1 rounded ${s === section ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                                aria-pressed={s === section}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <button
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded shadow"
                        onClick={() => exportCSV(filtered)}
                        title="Download CSV of filtered list"
                    >
                        <FaDownload /> Export
                    </button>
                </div>
            </div>

            {/* Table for larger screens */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="text-left text-sm text-gray-600">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Application ID</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Section</th>
                            <th className="px-4 py-3">Score</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <motion.tbody initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
                        {pageData.map((row, idx) => (
                            <motion.tr key={row.id} variants={rowVariant} className="border-t last:border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{(page - 1) * pageSize + idx + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium">{row.id}</td>
                                <td className="px-4 py-3 text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-sm">{row.section}</td>
                                <td className="px-4 py-3 text-sm">{row.score ?? "-"}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${row.status === "Admitted" ? "bg-green-100 text-green-700" : row.status === "Waitlist" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/admissions/${row.id}`} className="text-blue-600 hover:underline">View</Link>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
                {pageData.map((row) => (
                    <motion.div key={row.id} variants={rowVariant} initial="hidden" animate="visible" className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">{row.name}</div>
                                <div className="text-xs text-gray-500">{row.id} • {row.section}</div>
                            </div>

                            <div className="text-right">
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${row.status === "Admitted" ? "bg-green-100 text-green-700" : row.status === "Waitlist" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                    {row.status}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Score: {row.score ?? "-"}</div>
                            </div>
                        </div>

                        <div className="mt-3 text-right">
                            <Link href={`/admissions/${row.id}`} className="text-blue-600 hover:underline">View details</Link>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} applicants</div>

                <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded border bg-white" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                    <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
                    <button className="px-3 py-1 rounded border bg-white" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                </div>
            </div>

            <div className="mt-8 text-xs text-gray-500">
                Tip: Use the section filters to view lists by school section. Export the filtered list for offline use.
            </div>
        </div>
    );
}