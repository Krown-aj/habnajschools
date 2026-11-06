"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";

import { useGetParentById, useUpdateParent } from "@/hooks/useParents";
import { deriveDropboxPath, resolveImageSrcFallback } from "@/lib/utils/dropbox";

type ParentProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Parent: React.FC<ParentProps> = ({
    title = "Parent Profile",
    subtitle = "Overview of parent record",
}) => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const parentId = typeof params?.id === "string" ? params.id : undefined;

    const {
        data: parentData,
        isLoading: isParentLoading,
        isFetching: isParentFetching,
        error: fetchError,
    } = useGetParentById(parentId, { enabled: !!parentId, staleTime: 1000 * 60 * 5 });

    const { mutate: updateParent, isPending: isUpdating } = useUpdateParent();

    // show toast for fetch error
    useEffect(() => {
        if (fetchError) {
            toast.current?.show?.({
                severity: "error",
                summary: "Fetch Error",
                detail: fetchError.message || "Failed to fetch parent data.",
            });
        }
    }, [fetchError]);

    const handleBack = useCallback(() => router.back(), [router]);

    // handle avatar change via mutation hook
    const handleAvatarChange = useCallback(
        (meta: UploadResult) => {
            if (!parentId) {
                toast.current?.show?.({
                    severity: "warn",
                    summary: "Warning",
                    detail: "No parent ID to save avatar.",
                });
                return;
            }

            updateParent(
                { id: parentId, data: { avarta: meta.path } },
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
        [parentId, updateParent]
    );

    const isPending = Boolean(isParentLoading || isParentFetching || isUpdating);

    // memoize image props
    const imageProps = useMemo(() => {
        const path = deriveDropboxPath((parentData as any)?.avarta);
        const fallback = resolveImageSrcFallback((parentData as any)?.avarta);
        return { path, fallback };
    }, [parentData?.avarta]);

    // loading state UI
    if (isPending && !parentData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    // not found UI
    if (!parentData && !isParentLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Parent Not Found 😔</h2>
                <p className="text-gray-600 mb-6">
                    The parent record with ID: <strong>{parentId}</strong> could not be loaded or does not exist.
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
                                className="w-12 h-12 sm:w-24 sm:h-24 rounded-full object-cover"
                                width={96}
                                height={96}
                                alt={parentData?.firstname ? `${parentData.firstname}'s profile` : "profile"}
                                editable={!isUpdating}
                            />
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {`${parentData?.title || ""} ${parentData?.firstname || ""} ${parentData?.othername || ""} ${parentData?.surname || ""}`.trim()}
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
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Students" />
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                        <TabPanel header="Personal Data">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-2">
                                        <div>
                                            <dt className="font-semibold">Title</dt>
                                            <dd>{parentData?.title || "–"}</dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold">First Name</dt>
                                            <dd>{parentData?.firstname || "–"}</dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold">Surname</dt>
                                            <dd>{parentData?.surname || "–"}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold">Other Name</dt>
                                            <dd>{parentData?.othername || "–"}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-2">
                                        <div>
                                            <dt className="font-semibold">Gender</dt>
                                            <dd>{parentData?.gender || "–"}</dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold">Total Students</dt>
                                            <dd>
                                                <Badge value={parentData?._count?.students ?? (parentData?.students?.length ?? 0)} severity="info" />
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="font-semibold">Active Status</dt>
                                            <dd>
                                                <Badge value={parentData?.active ? "Active" : "Inactive"} severity={parentData?.active ? "success" : "danger"} />
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header={`Students (${parentData?._count?.students ?? (parentData?.students?.length ?? 0)})`}>
                            {parentData?.students?.length > 0 ? (
                                <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-600">
                                        <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-2 sm:px-4 py-3">Name</th>
                                                <th scope="col" className="px-2 sm:px-4 py-3">Class</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parentData.students.map((student: any) => (
                                                <tr key={student.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                    <td className="px-2 sm:px-4 py-3">{`${student.firstname || ""} ${student.surname || ""} ${student.othername || ""}`.trim() || "–"}</td>
                                                    <td className="px-2 sm:px-4 py-3">{student.class?.name || "–"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No students associated with this parent.</p>
                            )}
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            <Toast ref={toast} />
        </main>
    );
};

export default Parent;
