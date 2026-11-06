"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Book } from "lucide-react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";

import Spinner from "@/components/Spinner/Spinner";
import { useGetSubjectById } from "@/hooks/useSubjects";

type SubjectProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Subject: React.FC<SubjectProps> = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast | null>(null);
    const subjectId = params?.id as string | undefined;

    // Tab control
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Query: get subject by id
    const {
        data: subjectData,
        isLoading,
        isError,
        error,
    } = useGetSubjectById(subjectId, { enabled: Boolean(subjectId) });

    // show errors once via toast
    useEffect(() => {
        if (isError && error) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (error as any)?.message || "Failed to load subject data.",
                life: 4000,
            });
        }
    }, [isError, error]);

    const handleBack = () => router.back();

    // Memoized teacher rows to avoid remapping on every render
    const teachers = useMemo(() => subjectData?.teachers ?? [], [subjectData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Book className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{subjectData?.name || "Subject"}</h1>
                            <p className="text-xs sm:text-sm text-gray-500">
                                {`Overview of ${subjectData?.name || "this subject"} at Habnaj International Secondary Schools`}
                            </p>
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

                {/* Quick jump buttons */}
                <div className="flex gap-2 justify-end mb-4">
                    <Button onClick={() => setActiveIndex(0)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 0} label="Subject Info" />
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Teachers" />
                </div>

                <section className="grid grid-cols-1 gap-4 sm:gap-6">
                    <article className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                            <TabPanel header="Subject Info">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                            <div>
                                                <dt className="font-semibold pb-4">Category</dt>
                                                <dd>{subjectData?.category || "–"}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold pb-4">Section</dt>
                                                <dd>{subjectData?.section || "–"}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header="Teacher">
                                {teachers.length > 0 ? (
                                    <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-600">
                                            <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-2 sm:px-4 py-3">Name</th>
                                                    <th scope="col" className="px-2 sm:px-4 py-3">Gender</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teachers.map((teacher: any) => (
                                                    <tr key={teacher.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                        <td className="px-2 sm:px-4 py-3">
                                                            {[
                                                                teacher.title,
                                                                teacher.firstname,
                                                                teacher.othername,
                                                                teacher.surname,
                                                            ].filter(Boolean).join(" ").trim() || "–"}
                                                        </td>
                                                        <td className="px-2 sm:px-4 py-3">{teacher.gender || "–"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No teachers assigned to this subject.</p>
                                )}
                            </TabPanel>
                        </TabView>
                    </article>
                </section>
            </div>

            <Toast ref={toast} />
        </main>
    );
};

export default Subject;
