import React, { useState, useEffect, useRef, useCallback } from "react";
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

import Spinner from "@/components/Spinner/Spinner";

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
    const [subjects, setSubjects] = useState<any[]>([]);
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
    const permit = role.toLowerCase() === 'super' || role.toLowerCase() === 'admin';

    // Fetch subjects data on mount
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

    // Fetch subjects data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/subjects");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setSubjects(data?.data);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch subjects record, please try again.");
        } finally {
            setLoading(false);
        }
    };

    // A helper function to make API call to delete records
    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/subjects?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    // A helper function to confirm user's action
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1
                        ? "Do you really want to delete this subject?"
                        : `Do you really want to delete these ${ids.length} subjects?`,
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
                                ? "Subject deleted successfully."
                                : `${ids.length} subjects deleted successfully.`
                        );
                        setSubjects(prev => prev.filter(s => !ids.includes(s.id)));
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err.message || "Failed to delete subject, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
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
        router.push(`/dashboard/${role}/subjects/new`);
    }, [role]);

    // A helper function to handle navigation to view page
    const handleView = useCallback((currentSubject: any) => {
        router.push(`/dashboard/${role}/subjects/${currentSubject?.id}/view`);
    }, [role]);

    // A helper function to handle navigation to edit page
    const handleEdit = useCallback((currentSubject: any) => {
        router.push(`/dashboard/${role}/subjects/${currentSubject?.id}/edit`);
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
            />
        ),
        []
    );

    // A helper function to display context menu
    const getOverlayActions = useCallback((currentSubject: any) => {
        return [
            {
                label: "View",
                icon: <Eye className="w-4 h-4 mr-2" />,
                action: () => currentSubject && handleView(currentSubject)
            },
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => currentSubject && handleEdit(currentSubject)
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentSubject && deleteOne(currentSubject.id)
            },
        ];
    }, [role, deleteOne, handleEdit, handleView]);

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

                {/* Search input section */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search subjects..."
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
                        onSelectionChange={e => setSelected(e.value)}
                        loading={loading}
                        emptyMessage="No subjects found."
                        selectionMode="multiple"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                        <Column field="name" header="Name" sortable />
                        <Column field="category" header="Category" sortable />
                        <Column
                            header="Teachers"
                            body={(rowData) =>
                                rowData.teachers?.length > 0
                                    ? rowData.teachers
                                        .map((teacher: any) =>
                                            `${teacher.title || ""} ${teacher.firstname} ${teacher.othername || ""} ${teacher.surname}`.trim()
                                        )
                                        .join(", ")
                                    : "–"
                            }
                        />
                        {permit && (
                            <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                        )}
                    </DataTable>
                </div>
            </div>
            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} subject(s)`}
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

export default Subjects;