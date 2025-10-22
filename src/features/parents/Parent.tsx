"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";

type ParentProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Parent: React.FC<ParentProps> = () => {
    const router = useRouter();
    const params = useParams();
    const [parentData, setParentData] = useState<any>(null);
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const parentId = params.id;

    // Tab control
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Fetch parent data when component mounts
    useEffect(() => {
        const fetchParentData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/parents/${parentId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const result = await res.json();
                if (res.ok) {
                    setParentData(result.data || result);
                } else {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetch Error",
                        detail: result.error || "Could not fetch parent data.",
                    });
                }
            } catch (err: any) {
                toast.current?.show({
                    severity: "error",
                    summary: "Fetch Error",
                    detail: err.message || "Failed to fetch parent data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if (parentId) fetchParentData();
    }, [parentId]);

    // A helper function to handle back navigation
    const handleBack = () => router.back();

    // Determine whether avarta is a Dropbox path (leading slash) or an external URL
    const deriveDropboxPath = (avarta: any): string | null => {
        if (!avarta) return null;

        // object with url
        if (typeof avarta === "object" && typeof avarta.url === "string") {
            const p = normalize(avarta.url);
            return p.startsWith("/") ? p : null;
        }

        if (typeof avarta === "string") {
            if (/^https?:\/\//i.test(avarta) || avarta.startsWith("data:")) return null;
            // treat as relative/local path -> normalize to leading slash and treat as Dropbox path
            const p = normalize(avarta);
            return p.startsWith("/") ? p : null;
        }

        return null;

        function normalize(p: string) {
            const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "");
            return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
        }
    };

    const resolveImageSrcFallback = (avarta: any) => {
        const onlinePlaceholder = `https://www.gravatar.com/avatar/?d=mp&s=128`;
        const publicFallback = "/assets/profile1.png";

        if (!avarta) return onlinePlaceholder;

        if (typeof avarta === "object") {
            if (typeof avarta.url === "string" && avarta.url.length > 0) return normalize(avarta.url);
            return onlinePlaceholder;
        }

        if (typeof avarta === "string") {
            if (/^https?:\/\//i.test(avarta) || avarta.startsWith("data:")) return avarta;
            return normalize(avarta);
        }

        return onlinePlaceholder;

        function normalize(p: string) {
            const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "");
            if (!cleaned || cleaned.startsWith("src/") || cleaned.startsWith("assets/")) return publicFallback;
            return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
        }
    };

    // Handle update coming back from ImageView (after successful upload)
    const handleAvatarChange = useCallback(
        async (meta: UploadResult) => {
            setParentData((prev: any) => ({ ...prev, avarta: meta.path }));

            if (!parentId) {
                toast.current?.show({ severity: "warn", summary: "Warning", detail: "No parent ID to save avatar." });
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/parents/${parentId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ avarta: meta.path }),
                });
                let json: any = {};
                try { json = await res.json(); } catch { }

                if (!res.ok) {
                    const msg = json?.error || `Failed to save avatar (status ${res.status})`;
                    throw new Error(msg);
                }

                toast.current?.show({ severity: "success", summary: "Saved", detail: "Avatar updated successfully." });
                return json;
            } catch (err: any) {
                toast.current?.show({ severity: "error", summary: "Save failed", detail: err.message || String(err) });
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [parentId]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    const imageDropboxPath = deriveDropboxPath(parentData?.avarta);
    const fallbackImageSrc = resolveImageSrcFallback(parentData?.avarta);

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600 overflow-hidden">
                            {imageDropboxPath ? (
                                <ImageView
                                    path={imageDropboxPath}
                                    onChange={handleAvatarChange}
                                    placeholder={typeof fallbackImageSrc === "string" ? fallbackImageSrc : "/assets/profile1.png"}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl"
                                    width={64}
                                    height={64}
                                    alt={parentData?.firstname ? `${parentData.firstname}'s profile` : "profile"}
                                    editable={true}
                                />
                            ) : (
                                <ImageView
                                    path={null}
                                    placeholder={typeof fallbackImageSrc === "string" ? fallbackImageSrc : "/assets/profile1.png"}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl"
                                    width={64}
                                    height={64}
                                    alt={parentData?.firstname ? `${parentData.firstname}'s profile` : "profile"}
                                    editable={false}
                                />
                            )}
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {`${parentData?.title || ""} ${parentData?.firstname || ""} ${parentData?.othername || ""} ${parentData?.surname || ""}`.trim() || "Parent"}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">Overview of parent at Habnaj International Schools</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            icon="pi pi-arrow-left"
                            label="Back"
                            onClick={handleBack}
                            className="bg-red-500 border border-red-200 rounded-xl shadow-sm text-xs sm:text-sm font-medium hover:shadow-md hover:bg-red-600 transition-all duration-300"
                            aria-disabled
                        />
                    </div>
                </header>

                <div className="flex gap-2 justify-end mb-4">
                    <Button onClick={() => setActiveIndex(0)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 0} label="Personal Data" />
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Students" />
                </div>

                <section className="grid grid-cols-1 gap-4 sm:gap-6">
                    <article>
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
                                                    <dd><Badge value={parentData?._count?.students ?? (parentData?.students?.length ?? 0)} severity="info" /></dd>
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
                    </article>
                </section>
            </div>

            <Toast ref={toast} />
        </main>
    );
};

export default Parent;