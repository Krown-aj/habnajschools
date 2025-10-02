"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";

type ClassProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Class: React.FC<ClassProps> = () => {
    const router = useRouter();
    const params = useParams();
    const [classData, setClassData] = useState<any>(null);
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const classId = params.id;

    // Tab control
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Fetch class data
    useEffect(() => {
        const fetchClassData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/classes/${classId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const result = await res.json();
                if (res.ok) {
                    setClassData(result.data || result);
                } else {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetch Error",
                        detail: result.error || "Could not fetch class data.",
                    });
                }
            } catch (err: any) {
                toast.current?.show({
                    severity: "error",
                    summary: "Fetch Error",
                    detail: err.message || "Failed to fetch class data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchClassData();
        }
    }, [classId]);

    const handleBack = () => router.back();

    if (loading) {
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
                            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{classData?.name || "Class"}</h1>
                            <p className="text-xs sm:text-sm text-gray-500">{`Overview of ${classData?.name || "this class"} — Habnaj International Secondary Schools`}</p>
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

                {/* Quick jump buttons */}
                <div className="flex gap-2 justify-end mb-4">
                    <Button onClick={() => setActiveIndex(0)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 0} label="Class Info" />
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Students" />
                </div>

                <section className="grid grid-cols-1 gap-4 sm:gap-6">
                    <article className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                            <TabPanel header="Class Info">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-2">Overview</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">{classData?.description || "No description available."}</p>
                                    </div> */}

                                    <div>
                                        <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                            <div>
                                                <dt className="font-semibold">Form Master</dt>
                                                <dd>
                                                    {classData?.formmaster
                                                        ? `${classData.formmaster.title || ""} ${classData.formmaster.firstname || ""} ${classData.formmaster.othername || ""} ${classData.formmaster.surname || ""}`.trim()
                                                        : "–"}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Category</dt>
                                                <dd>{classData?.category || "–"}</dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Capacity</dt>
                                                <dd><Badge value={classData?.capacity ?? 0} severity="info" /></dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Total Students</dt>
                                                <dd><Badge value={classData?._count?.students ?? (classData?.students?.length ?? 0)} severity="info" /></dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header="Students">
                                {classData?.students?.length > 0 ? (
                                    <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-600">
                                            <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-2 sm:px-4 py-3">Admission Number</th>
                                                    <th scope="col" className="px-2 sm:px-4 py-3">Name</th>
                                                    <th scope="col" className="px-2 sm:px-4 py-3">Gender</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {classData.students.map((student: any) => (
                                                    <tr key={student.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                        <td className="px-2 sm:px-4 py-3">{student.admissionnumber || "–"}</td>
                                                        <td className="px-2 sm:px-4 py-3">{`${student.firstname || ""} ${student.othername || ""} ${student.surname || ""}`.trim() || "–"}</td>
                                                        <td className="px-2 sm:px-4 py-3">{student.gender || "–"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No students enrolled in this class.</p>
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

export default Class;
