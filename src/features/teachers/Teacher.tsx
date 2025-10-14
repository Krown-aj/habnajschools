"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import profilePic from "@/assets/profile1.png";
import { useRouter, useParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";

type TeacherProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Teacher: React.FC<TeacherProps> = () => {
    const router = useRouter();
    const params = useParams();
    const [teacherData, setTeacherData] = useState<any>(null);
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const teacherId = params?.id;

    // Tab control
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Fetch teacher data when component mounts
    useEffect(() => {
        const fetchTeacherData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/teachers/${teacherId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const result = await res.json();
                if (res.ok) {
                    setTeacherData(result.data || result);
                } else {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetch Error",
                        detail: result.error || "Could not fetch teacher data.",
                    });
                }
            } catch (err: any) {
                toast.current?.show({
                    severity: "error",
                    summary: "Fetch Error",
                    detail: err.message || "Failed to fetch teacher data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if (teacherId) {
            fetchTeacherData();
        }
    }, [teacherId]);

    // A helper function to handle back navigation
    const handleBack = () => {
        router.back();
    };

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
        if (!avarta) return profilePic;
        if (typeof avarta === "object") {
            if (typeof avarta.url === "string" && avarta.url.length > 0) return normalize(avarta.url);
            return profilePic;
        }
        if (typeof avarta === "string") {
            if (/^https?:\/\//i.test(avarta) || avarta.startsWith("data:")) return avarta;
            return normalize(avarta);
        }
        return profilePic;

        function normalize(p: string) {
            const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "");
            return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
        }
    };

    // handle update coming back from ImageView (after successful upload)
    // NOTE: this function returns a Promise that resolves after the server PUT finishes.
    const handleAvatarChange = useCallback(
        async (meta: UploadResult) => {
            setTeacherData((prev: any) => ({ ...prev, avarta: meta.path }));

            if (!teacherId) {
                toast.current?.show({ severity: "warn", summary: "Warning", detail: "No teacher ID to save avatar." });
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/teachers/${teacherId}`, {
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
        [teacherId]
    );


    // Loading effect
    if (loading && !teacherData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    const imageDropboxPath = deriveDropboxPath(teacherData?.avarta);
    const fallbackImageSrc = resolveImageSrcFallback(teacherData?.avarta);

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-12 h-12 sm:w-24 sm:h-24 rounded-full bg-indigo-50 shadow-sm text-indigo-600 overflow-visible pb-2">
                            {imageDropboxPath ? (
                                <ImageView
                                    path={imageDropboxPath}
                                    onChange={handleAvatarChange}
                                    placeholder={typeof fallbackImageSrc === "string" ? fallbackImageSrc : "/assets/profile.png"}
                                    className="w-12 h-12 sm:w-24 sm:h-24 rounded-full"
                                    width={96}
                                    height={96}
                                    alt={teacherData?.firstname ? `${teacherData.firstname}'s profile` : "profile"}
                                    editable={true} // explicit
                                />
                            ) : (
                                <Image
                                    src={(typeof fallbackImageSrc === "string" ? fallbackImageSrc : profilePic) as any}
                                    alt={teacherData?.firstname ? `${teacherData.firstname}'s profile` : "profile"}
                                    width={64}
                                    height={64}
                                    className="object-cover rounded-full"
                                    unoptimized={typeof fallbackImageSrc === "string" && /^https?:\/\//i.test(fallbackImageSrc as string)}
                                />
                            )}
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {`${teacherData?.title || ""} ${teacherData?.firstname || ""} ${teacherData?.othername || ""} ${teacherData?.surname || ""}`.trim()}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">{`Overview of teacher at Habnaj International Secondary Schools`}</p>
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

                {/* quick jump buttons */}
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
                                                {`${teacherData?.title || ""} ${teacherData?.firstname || ""} ${teacherData?.othername || ""} ${teacherData?.surname || ""}`.trim() ||
                                                    "–"}
                                            </dd>
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
                                                    <Badge value={teacherData?._count?.subjects ?? 0} severity="info" />
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold pb-3">Total Classes</dt>
                                                <dd>
                                                    <Badge value={teacherData?._count?.classes ?? 0} severity="info" />
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
