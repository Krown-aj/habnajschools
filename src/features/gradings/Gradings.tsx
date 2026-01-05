"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { Trash2, Edit, Eye, Book, Award, CheckCircle, XCircle, ClipboardList } from "lucide-react";
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
import { Tag } from "primereact/tag";

import Spinner from "@/components/Spinner/Spinner";
import { useGetGradings, useDeleteGradings, useUpdateGrading, useInvalidateGradings } from "@/hooks/useGradings";

type GradingsProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Gradings: React.FC<GradingsProps> = ({
    title = "School Gradings",
    subtitle = "Records of all the gradings in Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    // Filters
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    // Selection & UI state
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);

    // Permissions
    const role = (session?.user?.role || "Guest").toString();
    const permit = ["super", "admin", "management"].includes(role.toLowerCase());
    const teacher = role.toLowerCase() === "teacher";

    // Query hooks
    const { data: gradings = [], isLoading: listLoading, isFetching } = useGetGradings();
    const deleteMutation = useDeleteGradings();
    const updateMutation = useUpdateGrading();
    const invalidateGradings = useInvalidateGradings();

    // Toast helper
    const show = useCallback(
        (
            type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
            title: string,
            message: string
        ) => {
            toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
        },
        []
    );

    // Combined loading
    const loading = listLoading;

    // Delete API wrapper using the mutation (handles single or multiple ids)
    const deleteApi = useCallback(
        async (ids: string[]) => {
            // Use mutation.mutateAsync for awaiting and error handling
            await deleteMutation.mutateAsync(ids);
            // the hook will invalidate queries onSettled
        },
        [deleteMutation]
    );

    // Update publish status helper (keeps the "generate results before publish" behavior)
    const updatePublishStatus = useCallback(
        async (id: string, newPublished: boolean) => {
            setUpdatingIds(prev => [...prev, id]);
            try {
                if (newPublished) {
                    show("info", "Generating Results", "Generating report cards before publishing. This may take a while...");
                    const genRes = await fetch("/api/results", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gradingId: id }),
                    });

                    if (!genRes.ok) {
                        const errBody = await genRes.json().catch(() => ({}));
                        throw new Error(errBody?.error || `Failed to generate results (status ${genRes.status})`);
                    }

                    show("success", "Results Generated", "Report cards were generated successfully.");
                }

                // Use update mutation (expects { id, data })
                await updateMutation.mutateAsync({ id, data: { published: newPublished } });

                show("success", "Status Updated", `Grading ${newPublished ? "published" : "unpublished"} successfully.`);
                // invalidate or rely on optimistic update by hook; still explicitly invalidate to be safe
                invalidateGradings();
            } catch (err: any) {
                show("error", "Update Error", err?.message || "Failed to update grading status, please try again.");
            } finally {
                setUpdatingIds(prev => prev.filter(updatingId => updatingId !== id));
            }
        },
        [updateMutation, show, invalidateGradings]
    );

    // Confirm delete wrapper
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message: ids.length === 1 ? "Do you really want to delete this record?" : `Do you really want to delete these ${ids.length} records?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        await deleteApi(ids);
                        show("success", "Deleted", ids.length === 1 ? "Record deleted successfully." : `${ids.length} records deleted successfully.`);
                        // clear selection of deleted ids
                        setSelected(prev => prev.filter(g => !ids.includes(g.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err.message || "Failed to delete record, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [deleteApi, show]
    );

    // Single delete helper
    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );

    // Publish toggle confirm
    const handlePublishToggle = useCallback(
        (id: string, published: boolean) => {
            confirmDialog({
                message: `Do you really want to ${published ? "unpublish" : "publish"} this grading record?`,
                header: published ? "Confirm Unpublish" : "Confirm Publish",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-primary",
                rejectClassName: "p-button-text",
                accept: async () => {
                    await updatePublishStatus(id, !published);
                    panel.current?.hide();
                },
            });
        },
        [updatePublishStatus]
    );

    // Navigation helpers
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${role}/gradings/new`);
    }, [role, router]);

    const handleView = useCallback((currentGrading: any) => {
        router.push(`/dashboard/${role}/gradings/${currentGrading?.id}/view`);
    }, [role, router]);

    const handleEdit = useCallback((currentGrading: any) => {
        router.push(`/dashboard/${role}/gradings/${currentGrading?.id}/edit`);
    }, [role, router]);

    const handleGrade = useCallback((currentGrading: any) => {
        router.push(`/dashboard/${role}/gradings/${currentGrading?.id}/grade`);
    }, [role, router]);

    const handleMarkTraits = useCallback((currentGrading: any) => {
        router.push(`/dashboard/${role}/gradings/${currentGrading?.id}/traits`);
    }, [role, router]);

    // Action button in table
    const actionBody = useCallback(
        (row: any) => {
            // If user is a teacher and the grading is published, don't show actions
            if (teacher && row?.published) return null;

            return (
                <Button
                    icon="pi pi-ellipsis-v"
                    className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                    onClick={e => {
                        setCurrent(row);
                        panel.current?.toggle(e);
                    }}
                />
            );
        },
        [teacher]
    );

    // Build overlay actions depending on role
    const getOverlayActions = useCallback((currentGrading: any) => {
        const isTeacher = teacher;

        // Teacher: only Grade/MarkTraits if not published
        if (isTeacher) {
            const teacherActions: Array<{ label: string; icon: React.ReactNode; action: () => void }> = [];

            if (!currentGrading?.published) {
                teacherActions.push({
                    label: "Grade Students",
                    icon: <ClipboardList className="w-4 h-4 mr-2" />,
                    action: () => currentGrading && handleGrade(currentGrading),
                });
                teacherActions.push({
                    label: "Mark Traits",
                    icon: <Book className="w-4 h-4 mr-2" />,
                    action: () => currentGrading && handleMarkTraits(currentGrading),
                });
            }

            return teacherActions;
        }

        // Non-teacher (admin/super/management): full action set
        const actions: Array<{ label: string; icon: React.ReactNode; action: () => void }> = [
            {
                label: "View",
                icon: <Eye className="w-4 h-4 mr-2" />,
                action: () => currentGrading && handleView(currentGrading),
            },
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => currentGrading && handleEdit(currentGrading),
            },
            {
                label: currentGrading?.published ? "Unpublish" : "Publish",
                icon: currentGrading?.published ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />,
                action: () => currentGrading && handlePublishToggle(currentGrading.id, currentGrading.published),
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentGrading && deleteOne(currentGrading.id),
            },
        ];

        // Add Grade and Mark Traits options only if the grading is not published
        if (!currentGrading?.published) {
            const publishIndex = actions.findIndex(a => a.label === (currentGrading?.published ? "Unpublish" : "Publish"));
            const insertIndex = publishIndex >= 0 ? publishIndex : actions.length;

            const gradeAction = {
                label: "Grade Students",
                icon: <ClipboardList className="w-4 h-4 mr-2" />,
                action: () => currentGrading && handleGrade(currentGrading),
            };

            const markTraitsAction = {
                label: "Mark Traits",
                icon: <Book className="w-4 h-4 mr-2" />,
                action: () => currentGrading && handleMarkTraits(currentGrading),
            };

            actions.splice(insertIndex, 0, gradeAction, markTraitsAction);
        }

        return actions;
    }, [teacher, handleView, handleEdit, handlePublishToggle, deleteOne, handleGrade, handleMarkTraits]);

    // Status tag for rows
    const statusBody = useCallback(
        (row: any) => (
            <Tag
                value={row.published ? "Published" : "Draft"}
                severity={row.published ? "success" : "warning"}
                className="px-2 py-1"
            />
        ),
        []
    );

    // Loading state UI
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
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(deletingIds.length > 0 || updatingIds.length > 0 || isFetching) && (
                <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />
            )}
            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Page header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8" />
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

                {/* Search input section */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search gradings..."
                            onInput={e =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                {/* DataTable */}
                <div className="">
                    <DataTable
                        value={gradings}
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
                        onSelectionChange={e => setSelected(e.value)}
                        loading={loading}
                        emptyMessage="No gradings found."
                        selectionMode="multiple"
                    >
                        {permit && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}
                        <Column field="title" header="Title" sortable />
                        <Column field="session" header="Session" sortable />
                        <Column field="term" header="Term" sortable />
                        <Column field="published" header="Status" body={statusBody} sortable />
                        {(permit || teacher) && (
                            <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                        )}
                    </DataTable>
                </div>
            </div>

            {selected.length > 0 && permit && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} grading(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(g => g.id))}
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0 || updatingIds.length > 0}
                    />
                </div>
            )}

            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current && getOverlayActions(current).map(({ label, icon, action }) => (
                        <Button
                            key={label}
                            className="p-button-text text-gray-900 hover:bg-gray-100 w-full text-left px-4 py-2 rounded-none flex items-center"
                            onClick={action}
                            disabled={current && (updatingIds.includes(current.id) || deletingIds.includes(current.id))}
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

export default Gradings;
