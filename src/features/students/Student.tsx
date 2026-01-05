"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import moment from "moment";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";

import { useGetStudentById, useUpdateStudent } from "@/hooks/useStudents";
import { Student as StudentType } from '@/generated/prisma';
import { deriveDropboxPath, resolveImageSrcFallback } from "@/lib/utils/dropbox";

type StudentProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Student: React.FC<StudentProps> = () => {
    const router = useRouter();
    const params = useParams();
    const studentId = typeof params.id === 'string' ? params.id : undefined;

    const toast = useRef<Toast>(null);
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const {
        data: studentData,
        isLoading: isStudentLoading,
        error: fetchError,
    } = useGetStudentById(studentId, {
        enabled: !!studentId,
        staleTime: 1000 * 60 * 5
    });

    const {
        mutate: updateStudentMutation,
        isPending: isUpdatePending,
    } = useUpdateStudent();

    // Show toast for fetch error
    useEffect(() => {
        if (fetchError) {
            toast.current?.show({
                severity: "error",
                summary: "Fetch Error",
                detail: fetchError.message || "Failed to fetch student data.",
            });
        }
    }, [fetchError]);

    const handleBack = () => router.back();

    // Handle update coming back from ImageView
    const handleAvatarChange = useCallback(
        async (meta: UploadResult) => {
            if (!studentId) {
                toast.current?.show({ severity: "warn", summary: "Warning", detail: "No student ID to save avatar." });
                return;
            }

            updateStudentMutation({ id: studentId, data: { avarta: meta.path } }, {
                onSuccess: () => {
                    toast.current?.show({ severity: "success", summary: "Saved", detail: "Avatar updated successfully." });
                },
                onError: (err) => {
                    toast.current?.show({ severity: "error", summary: "Save failed", detail: err.message || "Failed to save avatar." });
                },
            });
        },
        [studentId, updateStudentMutation]
    );

    const isLoading = isStudentLoading || isUpdatePending;

    // Use memoized values for image props
    const imageProps = useMemo(() => {
        const path = deriveDropboxPath(studentData?.avarta);
        const fallback = resolveImageSrcFallback(studentData?.avarta);
        return { path, fallback };
    }, [studentData?.avarta]);

    // Handle loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    // Handle case where student is not found after loading
    if (!studentData && !isStudentLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Student Not Found 😔</h2>
                <p className="text-gray-600 mb-6">The student record with ID: **{studentId}** could not be loaded or does not exist.</p>
                <Button
                    label="Go Back"
                    icon="pi pi-arrow-left"
                    onClick={handleBack}
                    className="p-button-secondary"
                />
            </div>
        );
    }

    const imageDropboxPath = imageProps.path;
    const fallbackImageSrc = imageProps.fallback;

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600 overflow-hidden">
                            {/* ImageView component using computed path and fallback */}
                            <ImageView
                                path={imageDropboxPath}
                                onChange={handleAvatarChange}
                                placeholder={typeof fallbackImageSrc === "string" ? fallbackImageSrc : "/assets/profile1.png"}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl"
                                width={64}
                                height={64}
                                alt={studentData?.firstname ? `${studentData.firstname}'s profile` : "profile"}
                                editable={!isUpdatePending}
                            />
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {`${studentData?.firstname || ""} ${studentData?.othername || ""} ${studentData?.surname || ""}`.trim() || "Student"}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">Overview of student at Habnaj International Secondary Schools</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            icon="pi pi-arrow-left"
                            label="Back"
                            onClick={handleBack}
                            className="bg-red-500 border border-red-200 rounded-xl shadow-sm text-xs sm:text-sm font-medium hover:shadow-md hover:bg-red-600 transition-all duration-300"
                        />
                    </div>
                </header>

                <div className="flex gap-2 justify-end mb-4">
                    <Button onClick={() => setActiveIndex(0)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 0} label="Personal Data" />
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Attendance" />
                </div>

                <section className="grid grid-cols-1 gap-4 sm:gap-6">
                    <article>
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                                <TabPanel header="Personal Data">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                                <div>
                                                    <dt className="font-semibold">Name</dt>
                                                    <dd>{`${studentData?.firstname || ""} ${studentData?.othername || ""} ${studentData?.surname || ""}`.trim() || "–"}</dd>
                                                </div>

                                                <div>
                                                    <dt className="font-semibold">Date of Birth</dt>
                                                    <dd>{studentData?.birthday ? moment(studentData.birthday).format("LL") : "–"}</dd>
                                                </div>

                                                <div>
                                                    <dt className="font-semibold">Gender</dt>
                                                    <dd>{studentData?.gender || "–"}</dd>
                                                </div>

                                                <div>
                                                    <dt className="font-semibold">Class</dt>
                                                    <dd>{(studentData as StudentType & { class?: { name: string } })?.class?.name || "–"}</dd>
                                                </div>

                                                <div>
                                                    <dt className="font-semibold">Active Status</dt>
                                                    <dd>
                                                        <Badge value={studentData?.active ? "Active" : "Inactive"} severity={studentData?.active ? "success" : "danger"} />
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>

                                        <div>
                                            <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                                <div>
                                                    <dt className="font-semibold">Admission Date</dt>
                                                    <dd>{studentData?.admissiondate ? moment(studentData.admissiondate).format("LL") : "–"}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold">Section</dt>
                                                    <dd>{studentData?.section || "–"}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold">Guardian</dt>
                                                    {/* Assuming parent data is included and has necessary fields */}
                                                    <dd>{`${(studentData as any)?.parent?.title || ""} ${(studentData as any)?.parent?.firstname || ""} ${(studentData as any)?.parent?.othername || ""} ${(studentData as any)?.parent?.surname || ""}`.trim() || "–"}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold">House</dt>
                                                    <dd>{studentData?.house || "–"}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold">Address</dt>
                                                    <dd>{studentData?.address || "–"}</dd>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <dt className="font-semibold">Total Attendances</dt>
                                                        {/* Assuming _count.attendances or attendances.length is available */}
                                                        <dd><Badge value={(studentData as any)?._count?.attendances ?? ((studentData as any)?.attendances?.length ?? 0)} severity="info" /></dd>
                                                    </div>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                </TabPanel>

                                <TabPanel header="Attendance">
                                    {/* Assuming studentData.attendances is an array if included in the query result */}
                                    {(studentData as any)?.attendances?.length > 0 ? (
                                        <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-600">
                                                <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-2 sm:px-4 py-3">Date</th>
                                                        <th scope="col" className="px-2 sm:px-4 py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(studentData as any).attendances.map((attendance: any) => (
                                                        <tr key={attendance.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                            <td className="px-2 sm:px-4 py-3">{attendance.date ? new Date(attendance.date).toLocaleDateString() : "–"}</td>
                                                            <td className="px-2 sm:px-4 py-3">{attendance.status || "–"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No attendance records for this student.</p>
                                    )}
                                </TabPanel>
                            </TabView>
                        </div>
                    </article>
                </section>
            </div>

            <Toast ref={toast} />
        </main>
    );
};

export default Student;