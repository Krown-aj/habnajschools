"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Award } from "lucide-react";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import moment from "moment";

type GradingProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Grading: React.FC<GradingProps> = () => {
    const router = useRouter();
    const params = useParams();
    const [gradingData, setGradingData] = useState<any>(null);
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const gradingId = params.id;

    // Tab control
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Pagination state for student grades
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Fetch grading data when component mounts
    useEffect(() => {
        const fetchGradingData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/gradings/${gradingId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const result = await res.json();
                if (res.ok) {
                    setGradingData(result.data || result);
                    setCurrentPage(1); // reset pagination on new data
                } else {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetch Error",
                        detail: result.error || "Could not fetch grading data.",
                    });
                }
            } catch (err: any) {
                toast.current?.show({
                    severity: "error",
                    summary: "Fetch Error",
                    detail: err.message || "Failed to fetch grading data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if (gradingId) {
            fetchGradingData();
        }
    }, [gradingId]);

    // reset page when pageSize changes
    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize]);

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

    // student grades safe helpers
    const grades: any[] = gradingData?.studentGrades ?? [];
    const total = grades.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const visibleGrades = grades.slice(startIndex, endIndex);

    const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
    const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{gradingData?.title || "Grading"}</h1>
                            <p className="text-xs sm:text-sm text-gray-500">{`Overview of grading session at Habnaj International Secondary Schools`}</p>
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
                    <Button onClick={() => setActiveIndex(0)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 0} label="Grading Info" />
                    <Button onClick={() => setActiveIndex(1)} className="w-auto px-3 py-1 rounded-full" outlined={activeIndex !== 1} label="Student Grades" />
                </div>

                <section className="grid grid-cols-1 gap-4 sm:gap-6">
                    <article className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                            <TabPanel header="Grading Info">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                            <div>
                                                <dt className="font-semibold">Title</dt>
                                                <dd>{gradingData?.title || "–"}</dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Session</dt>
                                                <dd>{gradingData?.session || "–"}</dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Term</dt>
                                                <dd>{gradingData?.term || "–"}</dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Grading Policy</dt>
                                                <dd>{gradingData?.gradingPolicy?.title || "–"}</dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div>
                                        <dl className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-4">
                                            <div>
                                                <dt className="font-semibold">Status</dt>
                                                <dd>
                                                    <Badge value={gradingData?.published ? "Published" : "Draft"} severity={gradingData?.published ? "success" : "warning"} />
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Created At</dt>
                                                <dd>{gradingData?.createdAt ? moment(gradingData.createdAt).format("LL") : "–"}</dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Updated At</dt>
                                                <dd>{gradingData?.updatedAt ? moment(gradingData.updatedAt).format("LL") : "–"}</dd>
                                            </div>

                                            <div>
                                                <dt className="font-semibold">Total Student Grades</dt>
                                                <dd><Badge value={gradingData?._count?.studentGrades ?? total} severity="info" /></dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header={`Student Grades (${total})`}>
                                {total > 0 ? (
                                    <>
                                        <div className="overflow-x-auto sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            <table className="w-full min-w-[700px] text-xs sm:text-sm text-left text-gray-600">
                                                <thead className="text-xs sm:text-sm text-gray-700 uppercase bg-gray-50">
                                                    <tr>
                                                        <th className="px-2 sm:px-4 py-3">Student</th>
                                                        <th className="px-2 sm:px-4 py-3">Subject</th>
                                                        <th className="px-2 sm:px-4 py-3">Score</th>
                                                        <th className="px-2 sm:px-4 py-3">Grade</th>
                                                        <th className="px-2 sm:px-4 py-3">Remark</th>
                                                        <th className="px-2 sm:px-4 py-3">Position</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visibleGrades.map((grade: any) => {
                                                        const subjectName =
                                                            grade?.subject?.name ||
                                                            grade?.subjectName ||
                                                            grade?.subject?.title ||
                                                            "–";
                                                        const position =
                                                            grade?.position ??
                                                            grade?.subjectPosition ??
                                                            grade?.positionInSubject ??
                                                            "–";
                                                        const gradeLetter =
                                                            grade?.grade ||
                                                            grade?.letter ||
                                                            "–";
                                                        const remark =
                                                            grade?.remark ||
                                                            grade?.remarks ||
                                                            grade?.comment ||
                                                            "–";
                                                        const score = grade?.score ?? "–";

                                                        return (
                                                            <tr key={grade.id} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                                                                <td className="px-2 sm:px-4 py-3">{grade.student ? `${grade.student.firstname || ""} ${grade.student.surname || ""}`.trim() : "–"}</td>
                                                                <td className="px-2 sm:px-4 py-3">{subjectName}</td>
                                                                <td className="px-2 sm:px-4 py-3">{score}</td>
                                                                <td className="px-2 sm:px-4 py-3">{gradeLetter}</td>
                                                                <td className="px-2 sm:px-4 py-3">{remark}</td>
                                                                <td className="px-2 sm:px-4 py-3">{position}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination controls */}
                                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="text-xs text-gray-600">
                                                Showing <span className="font-medium">{startIndex + 1}</span> – <span className="font-medium">{endIndex}</span> of <span className="font-medium">{total}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-600">Rows:</label>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                                    className="text-xs border rounded px-2 py-1"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                </select>

                                                <Button onClick={goPrev} disabled={currentPage <= 1} className="px-3 py-1" label="Prev" />
                                                <div className="text-xs text-gray-600 px-2">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></div>
                                                <Button onClick={goNext} disabled={currentPage >= totalPages} className="px-3 py-1" label="Next" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">No student grades for this grading session.</p>
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

export default Grading;
