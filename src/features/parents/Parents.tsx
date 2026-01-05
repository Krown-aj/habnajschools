"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { Trash2, Edit, Eye, Users } from "lucide-react";
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
import { useGetParents, useDeleteParents, useInvalidateParents } from "@/hooks/useParents";

type ParentsProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Parents: React.FC<ParentsProps> = ({
    title = "School Parents",
    subtitle = "Records of all the parents in Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useRef<Toast | null>(null);
    const panel = useRef<any>(null);

    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || "Guest";
    const permit =
        role.toLowerCase() === "super" ||
        role.toLowerCase() === "admin" ||
        role.toLowerCase() === "management";

    // react-query hooks
    const { data: parentsData, isPending: isFetchingParents, isFetching } = useGetParents();
    const deleteMutation = useDeleteParents();
    const invalidateParents = useInvalidateParents();

    // Derived mapped parents for UI (fullname, phoneNumber, etc.)
    const parents = useMemo(() => {
        const arr = Array.isArray(parentsData) ? parentsData : [];
        return arr.map((p: any) => ({
            ...p,
            fullname: `${p.title || ""} ${p.firstname || ""} ${p.othername || ""} ${p.surname || ""}`.replace(
                /\s+/g,
                " "
            ).trim(),
            phoneNumber: p.phone || "–",
        }));
    }, [parentsData]);

    // Toast helper
    const show = useCallback(
        (type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined, summary: string, detail: string) => {
            toast.current?.show({ severity: type, summary, detail, life: 3000 });
        },
        []
    );

    // navigation helpers
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${role}/parents/new`);
    }, [router, role]);

    const handleView = useCallback(
        (currentParent: any) => {
            router.push(`/dashboard/${role}/parents/${currentParent?.id}/view`);
        },
        [router, role]
    );

    const handleEdit = useCallback(
        (currentParent: any) => {
            router.push(`/dashboard/${role}/parents/${currentParent?.id}/edit`);
        },
        [router, role]
    );

    // Actions for overlay
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

    const getOverlayActions = useCallback(
        (currentParent: any) => [
            {
                label: "View",
                icon: <Eye className="w-4 h-4 mr-2" />,
                action: () => currentParent && handleView(currentParent),
            },
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => currentParent && handleEdit(currentParent),
            },
            /* {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentParent && confirmDelete([currentParent.id]),
            }, */
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentParent && deleteOne(currentParent.id)
            },
        ],
        [handleEdit, handleView]
    );

    // Delete flow using deleteMutation (React Query)
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1
                        ? "Do you really want to delete this parent record?"
                        : `Do you really want to delete these ${ids.length} parent records?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: () => {
                    setDeletingIds(ids);
                    deleteMutation.mutate(ids, {
                        onSuccess: (res) => {
                            show(
                                "success",
                                "Deleted",
                                ids.length === 1 ? "Parent record deleted successfully." : `${ids.length} parent records deleted successfully.`
                            );
                            // update UI selections
                            setSelected((prev) => prev.filter((s) => !ids.includes(s.id)));
                            // Invalidate to ensure fresh data
                            invalidateParents();
                        },
                        onError: (err: any) => {
                            show("error", "Deletion Error", err?.message || "Failed to delete parent record(s), please try again.");
                        },
                        onSettled: () => {
                            setDeletingIds([]);
                        },
                    });
                },
            });
        },
        [deleteMutation, invalidateParents, show]
    );

    // Delete single
    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );

    // Combined loading state
    const loading = isFetchingParents || isFetching || deleteMutation.isPending || deletingIds.length > 0;

    // Render loading skeleton
    if (loading && (!parents || parents.length === 0)) {
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
            {(deletingIds.length > 0 || updatingIds.length > 0 || deleteMutation.isPending) && (
                <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Page header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
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
                            placeholder="Search parents..."
                            onInput={(e) =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                {/* DataTable */}
                <div>
                    <DataTable
                        value={parents}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        globalFilterFields={["fullname", "phoneNumber", "gender"]}
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        selection={selected}
                        onSelectionChange={(e) => setSelected(e.value)}
                        loading={loading}
                        emptyMessage="No parents found."
                        selectionMode="multiple"
                    >
                        {permit && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}

                        <Column
                            field="fullname"
                            header="Name"
                            body={(rowData) => rowData?.fullname || "–"}
                            sortable
                            filter
                            filterMatchMode={FilterMatchMode.CONTAINS}
                        />

                        <Column field="phoneNumber" header="Phone" sortable filter filterMatchMode={FilterMatchMode.CONTAINS} />
                        <Column field="gender" header="Gender" sortable filter filterMatchMode={FilterMatchMode.CONTAINS} />

                        {permit && (
                            <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                        )}
                    </DataTable>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} parent(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map((s) => s.id))}
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0 || updatingIds.length > 0 || deleteMutation.isPending}
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
                                disabled={current && deletingIds.includes(current.id)}
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

export default Parents;
