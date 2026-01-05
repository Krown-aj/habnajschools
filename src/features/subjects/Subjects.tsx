"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { Trash2, Edit, Eye, Book } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta, DataTableFilterMetaData } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";

import { useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/Spinner/Spinner";

import { useGetSubjects, useDeleteSubjects } from "@/hooks/useSubjects";

type SubjectsProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Subjects: React.FC<SubjectsProps> = ({
    title = "School Subjects",
    subtitle = "Records of all the subjects in Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const qc = useQueryClient();

    const toast = useRef<Toast | null>(null);
    const panel = useRef<OverlayPanel | null>(null);

    // UI state
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = (session?.user?.role ?? "Guest").toString();
    const roleLower = role.toLowerCase();
    const permit = roleLower === "super" || roleLower === "admin";
    const userId = session?.user?.id as string | undefined;

    // Build params depending on role: teacher -> teacherid, parent -> parentid
    const subjectParams = useMemo(() => {
        if (roleLower === "teacher" && userId) return { teacherid: userId };
        if (roleLower === "parent" && userId) return { parentid: userId };
        return undefined;
    }, [roleLower, userId]);

    // Query: subjects
    const {
        data: subjectsData,
        isLoading: isLoadingSubjects,
        isError: isSubjectsError,
        error: subjectsError,
    } = useGetSubjects(subjectParams);

    // Mutation: delete subjects (supports single and multiple)
    const deleteMutation = useDeleteSubjects();

    // Toast helper
    const show = useCallback(
        (type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined, title: string, message: string) => {
            toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
        },
        []
    );

    // Derived subjects list (source of truth is React Query cache)
    const subjects = (subjectsData ?? []) as any[];

    // Handle query error once
    if (isSubjectsError) {
        const msg = (subjectsError as any)?.message || "Failed to load subjects.";
        show("error", "Load Error", msg);
    }

    // Confirm deletion (uses mutation with optimistic update)
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1 ? "Do you really want to delete this subject?" : `Do you really want to delete these ${ids.length} subjects?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);

                    try {
                        // Mutate with optimistic updates handled inside hook
                        await deleteMutation.mutateAsync(ids);
                        show("success", "Deleted", ids.length === 1 ? "Subject deleted successfully." : `${ids.length} subjects deleted successfully.`);

                        // Clear selection for deleted ids
                        setSelected((prev) => prev.filter((s) => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err?.message || "Failed to delete subject, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [deleteMutation, show]
    );

    // Delete single record (from overlay)
    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );

    // Navigation handlers
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${roleLower}/subjects/new`);
    }, [router, roleLower]);

    const handleView = useCallback(
        (currentSubject: any) => {
            router.push(`/dashboard/${roleLower}/subjects/${currentSubject?.id}/view`);
        },
        [router, roleLower]
    );

    const handleEdit = useCallback(
        (currentSubject: any) => {
            router.push(`/dashboard/${roleLower}/subjects/${currentSubject?.id}/edit`);
        },
        [router, roleLower]
    );

    // Action button (ellipsis)
    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={(e) => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
            />
        ),
        []
    );

    // Overlay menu actions
    const getOverlayActions = useCallback(
        (currentSubject: any) => {
            return [
                {
                    label: "View",
                    icon: <Eye className="w-4 h-4 mr-2" />,
                    action: () => currentSubject && handleView(currentSubject),
                },
                {
                    label: "Edit",
                    icon: <Edit className="w-4 h-4 mr-2" />,
                    action: () => currentSubject && handleEdit(currentSubject),
                },
                {
                    label: "Delete",
                    icon: <Trash2 className="w-4 h-4 mr-2" />,
                    action: () => currentSubject && deleteOne(currentSubject.id),
                },
            ];
        },
        [handleView, handleEdit, deleteOne]
    );

    // Teachers body template
    const teachersBody = useCallback((rowData: any) => {
        const teachers = rowData.teachers || [];
        const count = teachers.length;

        if (count === 0) return <span className="text-gray-400">–</span>;

        const fullNames = teachers.map((t: any) =>
            [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(" ").trim()
        );

        const preview = fullNames.slice(0, 2).join(", ");
        const more = count > 2 ? `... (+${count - 2})` : "";

        return (
            <div title={fullNames.join(", ")} className="cursor-default">
                <div className="text-sm font-medium">{count}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">
                    {preview}
                    {more}
                </div>
            </div>
        );
    }, []);

    // Bulk delete handler from selected rows
    const handleBulkDelete = useCallback(() => {
        const ids = selected.map((s) => s.id);
        if (ids.length === 0) return;
        confirmDelete(ids);
    }, [selected, confirmDelete]);

    // Loading state (either fetching subjects or performing delete)
    const loading = isLoadingSubjects || deleteMutation.isPending;

    // Render loading screen if initial load
    if (isLoadingSubjects) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(deletingIds.length > 0 || updatingIds.length > 0) && <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Page header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Book className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                    </div>

                    {permit && (
                        <div className="flex gap-3">
                            <Button
                                label="Create"
                                icon={<FaPlus className="w-4 h-4" />}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                                onClick={handleNew}
                            />
                        </div>
                    )}
                </header>

                {/* Search input */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search subjects..."
                            onInput={(e) =>
                                setFilters({
                                    global: { value: (e.currentTarget as HTMLInputElement).value, matchMode: FilterMatchMode.CONTAINS },
                                })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                {/* DataTable */}
                <div>
                    <DataTable
                        value={subjects}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        selection={selected}
                        onSelectionChange={(e) => setSelected(e.value)}
                        loading={loading}
                        emptyMessage="No subjects found."
                        selectionMode="multiple"
                    >
                        {permit && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}
                        <Column field="name" header="Name" sortable />
                        <Column field="category" header="Category" sortable />
                        {permit && <Column header="Teachers" body={teachersBody} style={{ minWidth: "180px" }} />}
                        {permit && <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />}
                    </DataTable>
                </div>
            </div>

            {/* Bulk delete */}
            {selected.length > 0 && permit && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} subject(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={handleBulkDelete}
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0 || updatingIds.length > 0}
                    />
                </div>
            )}

            {/* Context menu */}
            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current &&
                        getOverlayActions(current).map(({ label, icon, action }) => (
                            <Button
                                key={label}
                                className="p-button-text text-gray-900 hover:bg-gray-100 w-full text-left px-4 py-2 rounded-none flex items-center"
                                onClick={action}
                                disabled={current && updatingIds.includes(current.id)}
                            >
                                {icon}
                                <span className="ml-2">{label}</span>
                            </Button>
                        ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Subjects;
