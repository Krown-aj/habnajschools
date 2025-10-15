"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { TrendingUp } from "lucide-react";

import CountChartContainer from "@/components/Charts/CountChartContainer";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import Announcements from "@/components/Events/Announcements";
import ImageView from "@/components/ImageView/ImageView";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface StudentPreview {
    id: string;
    admissionnumber?: string | null;
    firstname?: string | null;
    surname?: string | null;
    othername?: string | null;
    birthday?: string | null;
    email?: string | null;
    phone?: string | null;
    gender?: string | null;
    avarta?: string | null;
    class?: { id?: string | null; name?: string | null } | null;
    active?: boolean | null;
}

const Parent = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [students, setStudents] = useState<StudentPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useMemo(() => {
        if (typeof window !== "undefined") return new URLSearchParams(window.location.search);
        return new URLSearchParams();
    }, []);

    const fetchedRef = useRef(false);

    const fetchStudents = useCallback(async () => {
        if (!session) return;

        fetchedRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/students`, { method: "GET", headers: { "Content-Type": "application/json" } });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Students fetch failed: ${res.status} ${txt}`);
            }

            const json = await res.json();
            const data = json?.data ?? json?.students ?? json;

            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching students:", err);
            setError(err instanceof Error ? err.message : "Failed to load students");
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/auth/signin");
            return;
        }

        if (session.user?.role !== "parent") {
            router.push(`/dashboard/${session.user?.role}`);
            return;
        }

        if (!fetchedRef.current) fetchStudents();
    }, [status, session, router, fetchStudents]);

    const studentsByGender = useMemo(() => {
        const map = students.reduce<Record<string, number>>((acc, s) => {
            const g = (s.gender || "Unknown").toString();
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(map).map(([gender, count]) => ({ gender, _count: { _all: count } }));
    }, [students]);

    // Renderers for DataTable

    const nameBody = (row: StudentPreview) =>
        `${row.firstname ?? ""} ${row.othername ? row.othername + " " : ""}${row.surname ?? ""}`.trim();

    const avatarBody = (row: StudentPreview) => {
        // Prepare a ui-avatars placeholder from name
        const displayName = `${row.firstname ?? ""} ${row.surname ?? ""}`.trim() || "Student";
        const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=128`;

        // If avarta exists use it, otherwise undefined so ImageView uses placeholder prop
        const avatarPath = row.avarta && row.avarta.trim() !== "" ? row.avarta : undefined;

        return (
            <div className="w-10 h-10 rounded-full overflow-hidden">
                <ImageView
                    path={avatarPath}
                    placeholder={placeholder}
                    className="w-10 h-10 rounded-full object-cover"
                    width={40}
                    height={40}
                    alt={displayName}
                    editable={false}
                />
            </div>
        );
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user?.role !== "parent") return null;

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            fetchedRef.current = false;
                            fetchStudents();
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const parentName = `${(session.user as any)?.firstname ?? ""} ${(session.user as any)?.surname ?? ""}`.trim() || `${session.user?.name}`;

    // pluralization for children count line
    const childrenCountText = students.length === 1
        ? `You have 1 child in this school.`
        : `You have ${students.length} children in this school.`;

    return (
        <section className="p-4 lg:p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome {parentName || "Parent"}!</h1>
                            <p className="text-gray-600">Overview of your children</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 flex-col xl:flex-row">
                    {/* LEFT COLUMN */}
                    <div className="w-full sm:w-2/3 flex flex-col gap-8">
                        {/* STUDENTS BY GENDER CHART */}
                        <div className="">
                            <CountChartContainer data={studentsByGender} />
                        </div>

                        {/* STUDENTS TABLE (preview) */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">{childrenCountText}</p>
                            </div>

                            <div className="w-full">
                                <DataTable value={students} paginator rows={5} responsiveLayout="scroll" emptyMessage="No students to show">
                                    <Column body={avatarBody} header="" style={{ width: 72 }} />
                                    <Column field="admissionnumber" header="Admission" sortable />
                                    <Column header="Name" body={nameBody} sortable />
                                    <Column field="class.name" header="Class" body={(row: StudentPreview) => row.class?.name ?? "Not assigned"} sortable />
                                </DataTable>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="w-full sm:w-1/3 flex flex-col gap-8">
                        <EventCalendarContainer searchParams={Object.fromEntries(searchParams)} />
                        <Announcements />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Parent;
