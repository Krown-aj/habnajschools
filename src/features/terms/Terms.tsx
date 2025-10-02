import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { Trash2, ToggleLeft, ToggleRight, Calendar, Edit, } from "lucide-react";
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
import moment from "moment";

import { Term } from "@/generated/prisma";
import Spinner from "@/components/Spinner/Spinner";

type TermsProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Terms: React.FC<TermsProps> = ({
    title = "School Terms",
    subtitle = "Records of all the terms in Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [terms, setTerms] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || 'Guest';

    const permited = role.toLocaleLowerCase() === 'super' || role.toLocaleLowerCase() === 'admin'

    // Display terms record on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Toast helper function
    const show = useCallback((
        type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
        title: string,
        message: string
    ) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    // Fetch terms data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/terms");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setTerms(data?.data);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch terms record, please try again.");
        } finally {
            setLoading(false);
        }
    };

    // A helper function to make api call to delete records
    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/terms?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    // A helper function to make api call to update role or status
    const updateTermApi = async (term: any, updates: { status?: string }) => {
        const updatedTermData = { ...term, ...updates };
        const res = await fetch(`/api/terms/${term.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedTermData),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res.json();
    };

    // A helper function to confirm user's action
    const confirmDelete = useCallback(
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
                        await deleteApi(ids);
                        show(
                            "success",
                            "Deleted",
                            ids.length === 1
                                ? "Record deleted successfully."
                                : `${ids.length} records deleted successfully.`
                        );
                        setTerms(prev => prev.filter(s => !ids.includes(s.id)));
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err.message || "Failed to delete record, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [show]
    );

    // A helper function to update status
    const updateStatus = useCallback(
        (term: any, newStatus: string) => {
            setUpdatingIds([term.id]);
            updateTermApi(term, { status: newStatus })
                .then((updatedTerm) => {
                    show("success", "Status Updated", `Term has been ${newStatus ? 'enabled' : 'disabled'} successfully.`);
                    setTimeout(() => {
                        fetchData();
                    }, 3000);
                })
                .catch((err) => {
                    show("error", "Update Error", err.message || "Failed to update status.");
                })
                .finally(() => {
                    setUpdatingIds([]);
                    panel.current?.hide();
                });
        },
        [show]
    );

    // A helper function to delete single record
    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );

    // A helper function to handle navigation to new page
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${role}/terms/new`);
    }, [role]);

    // A helper function to handle navigation to new page
    const handleEdit = useCallback((currentTerm: any) => {
        console.log('Current:', currentTerm)
        router.push(`/dashboard/${role}/terms/${currentTerm?.id}/edit`);
    }, [role]);

    // A helper function to display action body
    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={e => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
                disabled={updatingIds.includes(row.id)}
            />
        ),
        [updatingIds]
    );

    // A helper function to display context menu
    const getOverlayActions = useCallback((currentTerm: any) => {
        return [
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => currentTerm && handleEdit(currentTerm)
            },
            {
                label: currentTerm?.status === 'Active' ? "Disable" : "Enable",
                icon: currentTerm?.active ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />,
                action: () => currentTerm && updateStatus(currentTerm, currentTerm.status === "Active" ? "Inactive" : "Active")
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentTerm && deleteOne(currentTerm.id)
            },
        ];
    }, [role, updateStatus, deleteOne]);

    // A helper function to display status
    const statusBodyTemplate = useCallback((row: Term) => (
        <span className="flex items-center justify-center">
            <Tag value={row.status === 'Active' ? 'Active' : 'Inactive'} severity={row.status === 'Active' ? 'success' : 'danger'} className="capitalize w-full py-1.5" />
        </span>
    ), []);

    // Loading effect 
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
            {(deletingIds.length > 0 || updatingIds.length > 0) && (
                <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />
            )}
            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Page header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                    </div>

                    {permited && (<div className="flex gap-3">
                        <Button
                            label="Create"
                            icon={<FaPlus className="w-4 h-4" />}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                            onClick={handleNew}
                        />
                    </div>)}
                </header>

                {/* Search input section */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search terms..."
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
                        value={terms}
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
                        emptyMessage="No terms found."
                        selectionMode="multiple"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                        <Column field='session' header='Session' sortable />
                        <Column field='term' header='Term' sortable />
                        <Column field='start' header='Start' body={(row) => moment(row.start).format('DD MMM YYYY')} />
                        <Column field='end' header='End' body={(row) => moment(row.end).format('DD MMM YYYY')} />
                        <Column field='daysopen' header='Days Opened' />
                        <Column field='nextterm' header='Next Term Begins' body={(row) => moment(row.nextterm).format('DD MMM YYYY')} />
                        <Column
                            header="Status"
                            body={statusBodyTemplate}
                        />
                        {permited && (<Column body={actionBody} header="Actions" style={{ textAlign: 'center', width: '4rem' }} />)}
                    </DataTable>
                </div>
            </div>
            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} record(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
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

export default Terms;