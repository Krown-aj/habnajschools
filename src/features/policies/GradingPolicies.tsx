"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { Trash2, Edit, Eye, Award } from "lucide-react";
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

import Spinner from "@/components/Spinner/Spinner";
import { useGetGradingPolicies, useDeleteGradingPolicies, useInvalidateGradingPolicies } from "@/hooks/useGradingPolicies";

type GradingPoliciesProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const GradingPolicies: React.FC<GradingPoliciesProps> = ({
    title = "Grading Policies",
    subtitle = "Records of all the grading policies of Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();

    // React Query hooks
    const { data: policiesData, isLoading: isPending, isFetching } = useGetGradingPolicies();
    const deleteMutation = useDeleteGradingPolicies();
    const invalidate = useInvalidateGradingPolicies();

    const policies = policiesData ?? [];

    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || "Guest";
    const permit =
        role.toLowerCase() === "super" ||
        role.toLowerCase() === "admin" ||
        role.toLowerCase() === "management";

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

    // Confirm & delete using React Query mutation
    const handleConfirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1
                        ? "Do you really want to delete this record?"
                        : `Do you really want to delete these ${ids.length} records?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        // use the mutation (it should perform optimistic update via your hook)
                        await deleteMutation.mutateAsync(ids);
                        show(
                            "success",
                            "Deleted",
                            ids.length === 1 ? "Record deleted successfully." : `${ids.length} records deleted successfully.`
                        );
                        // clear selection if any of the selected were deleted
                        setSelected(prev => prev.filter(p => !ids.includes(p.id)));
                        // Invalidate to be safe (your hook also invalidates onSettled)
                        invalidate();
                    } catch (err: any) {
                        show("error", "Deletion Error", err?.message || "Failed to delete record, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [deleteMutation, invalidate, show]
    );

    const deleteOne = useCallback(
        (id: string) => {
            handleConfirmDelete([id]);
            panel.current?.hide();
        },
        [handleConfirmDelete]
    );

    // Navigation helpers
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${role}/settings/grading-policies/new`);
    }, [role, router]);

    const handleView = useCallback(
        (currentPolicy: any) => {
            router.push(`/dashboard/${role}/settings/grading-policies/${currentPolicy?.id}/view`);
        },
        [role, router]
    );

    const handleEdit = useCallback(
        (currentPolicy: any) => {
            router.push(`/dashboard/${role}/settings/grading-policies/${currentPolicy?.id}/edit`);
        },
        [role, router]
    );

    // Actions & overlays
    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={e => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
            />
        ),
        []
    );

    const getOverlayActions = useCallback(
        (currentPolicy: any) => [
            {
                label: "View",
                icon: <Eye className="w-4 h-4 mr-2" />,
                action: () => currentPolicy && handleView(currentPolicy),
            },
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => currentPolicy && handleEdit(currentPolicy),
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentPolicy && deleteOne(currentPolicy.id),
            },
        ],
        [deleteOne, handleEdit, handleView]
    );

    // Render helpers for traits/assessments
    const traitsBody = useCallback((rowData: any) => {
        const names: string[] = (rowData.traits || []).map((t: any) => t.name);
        const count = names.length;
        if (count === 0) return <span>0</span>;

        const preview = names.slice(0, 3).join(", ");
        const more = count > 3 ? `... (+${count - 3})` : "";
        return (
            <div title={names.join(", ")}>
                <div className="text-sm font-medium">{count}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">
                    {preview}
                    {more}
                </div>
            </div>
        );
    }, []);

    const assessmentsBody = useCallback((rowData: any) => {
        const names: string[] = (rowData.assessments || []).map((a: any) => a.name);
        const count = names.length;
        if (count === 0) return <span>0</span>;

        const preview = names.slice(0, 3).join(", ");
        const more = count > 3 ? `... (+${count - 3})` : "";
        return (
            <div title={names.join(", ")}>
                <div className="text-sm font-medium">{count}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">
                    {preview}
                    {more}
                </div>
            </div>
        );
    }, []);

    // Combined loading state
    const loading = isFetching || deleteMutation.isPending;

    // memoized selected IDs for bulk delete
    const selectedIds = useMemo(() => selected.map(p => p.id), [selected]);

    // Loading effect (same UI you had before)
    if (loading && !policies.length) {
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
            {(deletingIds.length > 0 || updatingIds.length > 0) && (
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
                            placeholder="Search grading policies..."
                            onInput={e =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                {/* DataTable */}
                <div>
                    <DataTable
                        value={policies}
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
                        loading={isFetching}
                        emptyMessage="No grading policies found."
                        selectionMode="multiple"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="passMark" header="Pass Mark" sortable />
                        <Column field="maxScore" header="Max Score" sortable />
                        <Column header="Assessments" body={assessmentsBody} />
                        <Column header="Traits" body={traitsBody} sortable={false} />
                        {permit && (
                            <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                        )}
                    </DataTable>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} grading policy(ies)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => handleConfirmDelete(selectedIds)}
                        loading={deleteMutation.isPending}
                        disabled={deleteMutation.isPending || updatingIds.length > 0}
                    />
                </div>
            )}

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

export default GradingPolicies;
