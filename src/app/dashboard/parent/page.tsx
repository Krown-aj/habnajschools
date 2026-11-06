"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useCallback, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";

import CountChartContainer from "@/components/Charts/CountChartContainer";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import Announcements from "@/components/Events/Announcements";
import ImageView from "@/components/ImageView/ImageView";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { useGetStudents } from "@/hooks/useStudents";
import type { Student as StudentType } from "@/generated/prisma";

interface StudentPreview extends StudentType {
    class?: { id?: string | null; name?: string | null } | null;
}

const Parent: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const toastRef = useRef<HTMLDivElement>(null);

    // Parent ID from session
    const parentId = session?.user?.id;

    // Fetch students via hook
    const { data: studentsData, isLoading, error } = useGetStudents({
        parentid: parentId || undefined,
    });

    // Map students and add fullname & className
    const students: StudentPreview[] = useMemo(() => {
        if (!studentsData) return [];

        return studentsData.map((s) => ({
            ...s,
            fullname: `${s.firstname ?? ""} ${s.othername ?? ""} ${s.surname ?? ""}`.replace(/\s+/g, " ").trim(),
            className: (s as any).class?.name ?? "Not assigned",
        }));
    }, [studentsData]);

    const studentsByGender = useMemo(() => {
        return Object.entries(
            students.reduce<Record<string, number>>((acc, s) => {
                const gender = s.gender || "Unknown";
                acc[gender] = (acc[gender] || 0) + 1;
                return acc;
            }, {})
        ).map(([gender, count]) => ({ gender, _count: { _all: count } }));
    }, [students]);

    // Renderers
    const nameBody = useCallback(
        (row: StudentPreview) =>
            `${row.firstname ?? ""} ${row.othername ? row.othername + " " : ""}${row.surname ?? ""}`.trim(),
        []
    );

    const avatarBody = useCallback((row: StudentPreview) => {
        const displayName = `${row.firstname ?? ""} ${row.surname ?? ""}`.trim() || "Student";
        const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=128`;
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
    }, []);

    // Redirect logic
    if (status === "loading" || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        router.push("/auth/signin");
        return null;
    }

    if (session.user?.role !== "parent") {
        router.push(`/dashboard/${session.user?.role}`);
        return null;
    }

    const parentName = `${(session.user as any)?.firstname ?? ""}  ${(session.user as any)?.surname ?? ""}`.trim() || `${session.user?.name}`;

    const childrenCountText =
        students.length === 1
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
                        <div>
                            <CountChartContainer data={studentsByGender} />
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">{childrenCountText}</p>
                            </div>
                            <DataTable
                                value={students}
                                paginator
                                rows={5}
                                responsiveLayout="scroll"
                                emptyMessage="No students to show"
                            >
                                <Column body={avatarBody} header="" style={{ width: 72 }} />
                                <Column field="admissionnumber" header="Admission" sortable />
                                <Column header="Name" body={nameBody} sortable />
                                <Column field="className" header="Class" sortable />
                            </DataTable>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="w-full sm:w-1/3 flex flex-col gap-8">
                        <EventCalendarContainer searchParams={{ parentid: parentId ?? "" }} />
                        <Announcements />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Parent;
