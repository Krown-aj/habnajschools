"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
//import profilePic from "@/assets/profile1.png";
import { useRouter, useParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";

import { useGetTeacherById, useUpdateTeacher } from "@/hooks/useTeachers";
import { deriveDropboxPath, resolveImageSrcFallback } from "@/lib/utils/dropbox";

type TeacherProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Teacher: React.FC<TeacherProps> = ({
    title = "Teacher Profile",
    subtitle = "Overview of teacher record",
}) => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const teacherId = typeof params?.id === "string" ? params.id : undefined;

    const {
        data: teacherData,
        isPending: isTeacherLoading,
        error: fetchError,
    } = useGetTeacherById(teacherId, {
        enabled: !!teacherId,
        staleTime: 1000 * 60 * 5,
    });

    const { mutate: updateTeacher, isPending: isUpdating } = useUpdateTeacher();

    // Show toast for fetch errors
    useEffect(() => {
        if (fetchError) {
            toast.current?.show?.({
                severity: "error",
                summary: "Fetch Error",
                detail: fetchError.message || "Failed to fetch teacher data.",
            });
        }
    }, [fetchError]);

    const handleBack = useCallback(() => router.back(), [router]);

    // Handle avatar change via mutation
    const handleAvatarChange = useCallback(
        (meta: UploadResult) => {
            if (!teacherId) {
                toast.current?.show?.({
                    severity: "warn",
                    summary: "Warning",
                    detail: "No teacher ID to save avatar.",
                });
                return;
            }

            updateTeacher(
                { id: teacherId, data: { avarta: meta.path } },
                {
                    onSuccess: () => {
                        toast.current?.show?.({
                            severity: "success",
                            summary: "Saved",
                            detail: "Avatar updated successfully.",
                        });
                    },
                    onError: (err: any) => {
                        toast.current?.show?.({
                            severity: "error",
                            summary: "Save failed",
                            detail: err?.message || "Failed to save avatar.",
                        });
                    },
                }
            );
        },
        [teacherId, updateTeacher]
    );

    const isPending = isTeacherLoading || isUpdating;

    // Memoize image props
    const imageProps = useMemo(() => {
        const path = deriveDropboxPath((teacherData as any)?.avarta);
        const fallback = resolveImageSrcFallback((teacherData as any)?.avarta);
        return { path, fallback };
    }, [teacherData?.avarta]);

    if (isPending && !teacherData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    if (!teacherData && !isTeacherLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Teacher Not Found 😔</h2>
                <p className="text-gray-600 mb-6">
                    The teacher record with ID: <strong>{teacherId}</strong> could not be loaded or does not exist.
                </p>
                <Button label="Go Back" icon="pi pi-arrow-left" onClick={handleBack} className="p-button-secondary" />
                <Toast ref={toast} />
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
                        <div className="flex items-center justify-center w-12 h-12 sm:w-24 sm:h-24 rounded-full bg-indigo-50 shadow-sm text-indigo-600 overflow-hidden pb-2">
                            <ImageView
                                path={imageDropboxPath}
                                onChange={handleAvatarChange}
                                placeholder={
                                    typeof fallbackImageSrc === "string"
                                        ? fallbackImageSrc
                                        : "/assets/profile1.webp"
                                }
                                /*  placeholder={typeof fallbackImageSrc === "string" ? fallbackImageSrc : profilePic.src} */
                                className="w-12 h-12 sm:w-24 sm:h-24 rounded-full object-cover"
                                width={96}
                                height={96}
                                alt={teacherData?.firstname ? `${teacherData.firstname}'s profile` : "profile"}
                                editable={!isUpdating}
                            />
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {`${teacherData?.title || ""} ${teacherData?.firstname || ""} ${teacherData?.othername || ""} ${teacherData?.surname || ""}`.trim()}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
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
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Subjects" />
                    <Button onClick={() => setActiveIndex(2)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 2} label="Classes" />
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                        <TabPanel header="Personal Data">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                        <div>
                                            <dt className="font-semibold pb-3">Name</dt>
                                            <dd>
                                                {`${teacherData?.title || ""} ${teacherData?.firstname || ""} ${teacherData?.othername || ""} ${teacherData?.surname || ""}`.trim() || "–"}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold pb-3">Section</dt>
                                            <dd>{teacherData?.section || "–"}</dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold pb-3">Qualifications</dt>
                                            <dd>{teacherData?.qualification || "–"}</dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold pb-3">Active Status</dt>
                                            <dd>
                                                <Badge value={teacherData?.active ? "Active" : "Inactive"} severity={teacherData?.active ? "success" : "danger"} />
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                        <div>
                                            <dt className="font-semibold pb-3">Address</dt>
                                            <dd>{teacherData?.address || "–"}</dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold pb-3">State / LGA</dt>
                                            <dd>{`${teacherData?.state || "–"}${teacherData?.lga ? ` / ${teacherData?.lga}` : ""}`}</dd>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div>
                                                <dt className="font-semibold pb-3">Total Subjects</dt>
                                                <dd>
                                                    <Badge value={teacherData?._count?.subjects ?? (teacherData?.subjects?.length ?? 0)} severity="info" />
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold pb-3">Total Classes</dt>
                                                <dd>
                                                    <Badge value={teacherData?._count?.classes ?? (teacherData?.classes?.length ?? 0)} severity="info" />
                                                </dd>
                                            </div>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header={`Subjects (${teacherData?.subjects?.length ?? 0})`}>
                            {teacherData?.subjects?.length > 0 ? (
                                <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-600">
                                        <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-2 sm:px-4 py-3">Name</th>
                                                <th scope="col" className="px-2 sm:px-4 py-3">Category</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacherData.subjects.map((subject: any) => (
                                                <tr key={subject.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                    <td className="px-2 sm:px-4 py-3">{subject.name || "–"}</td>
                                                    <td className="px-2 sm:px-4 py-3">{subject.category || "–"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No subjects assigned to this teacher.</p>
                            )}
                        </TabPanel>

                        <TabPanel header={`Classes (${teacherData?.classes?.length ?? 0})`}>
                            {teacherData?.classes?.length > 0 ? (
                                <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-600">
                                        <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-2 sm:px-4 py-3">Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacherData.classes.map((cls: any) => (
                                                <tr key={cls.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                    <td className="px-2 sm:px-4 py-3">{cls.name || "–"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No classes assigned to this teacher.</p>
                            )}
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            <Toast ref={toast} />
        </main>
    );
};

export default Teacher;
