"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

import { useGetTeachers, useDeleteTeachers } from "@/hooks/useTeachers";
import Spinner from "@/components/Spinner/Spinner";
import { Teacher as TeacherType } from '@/generated/prisma';

// Extend TeacherType with computed fields for search/display
type TeacherDisplayType = TeacherType & {
    fullname: string;
    emailAddress: string;
    phoneNumber: string;
    qualificationText: string;
    genderText: string;
};

type TeachersProps = {
    title?: string;
    subtitle?: string;
};

const Teachers: React.FC<TeachersProps> = ({
    title = "School Teachers",
    subtitle = "Records of all the teachers in Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [selected, setSelected] = useState<TeacherDisplayType[]>([]);
    const [current, setCurrent] = useState<TeacherDisplayType | null>(null);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    // Data Fetching with useQuery
    const {
        data: teachersData,
        isLoading,
        error: fetchError,
        isFetching,
    } = useGetTeachers();

    // Data Deletion with useMutation
    const deleteMutation = useDeleteTeachers();

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || 'Guest';
    const permit = role.toLowerCase() === 'super' || role.toLowerCase() === 'admin';

    const isDeleting = deleteMutation.isPending;
    const deletingIds = isDeleting ? (Array.isArray(deleteMutation.variables) ? deleteMutation.variables : [deleteMutation.variables]) : [];

    // Map fetched data to include computed fields for display/search
    const teachers: TeacherDisplayType[] = useMemo(() => {
        if (!teachersData) return [];
        return teachersData.map((t: TeacherType): TeacherDisplayType => ({
            ...t,
            fullname: `${t.title || ''} ${t.firstname || ''} ${t.othername || ''} ${t.surname || ''}`.replace(/\s+/g, ' ').trim(),
            emailAddress: (t as any).email || (t as any).emailAddress || (t as any).contactEmail || '',
            phoneNumber: (t as any).phone || (t as any).phoneNumber || (t as any).contact || '',
            qualificationText: (t as any).qualification || '',
            genderText: (t as any).gender || ''
        }));
    }, [teachersData]);

    // Handle Fetch Error
    useEffect(() => {
        if (fetchError) {
            show("error", "Fetch Error", "Failed to fetch teachers record, please try again.");
        }
    }, [fetchError]);

    // Toast helper function
    const show = useCallback((
        type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
        title: string,
        message: string
    ) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    // A helper function to confirm user's action and trigger mutation
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
                accept: () => {
                    deleteMutation.mutate(ids, {
                        onSuccess: (data) => {
                            show(
                                "success",
                                "Deleted",
                                data.deleted === 1
                                    ? "Record deleted successfully."
                                    : `${data.deleted} records deleted successfully.`
                            );
                            setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                        },
                        onError: (err) => {
                            show("error", "Deletion Error", err.message || "Failed to delete record, please try again.");
                        },
                    });
                },
            });
        },
        [show, deleteMutation]
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
        router.push(`/dashboard/${role}/teachers/new`);
    }, [role, router]);

    // A helper function to handle navigation to view page
    const handleView = useCallback((currentTeacher: TeacherDisplayType) => {
        router.push(`/dashboard/${role}/teachers/${currentTeacher.id}/view`);
    }, [role, router]);

    // A helper function to handle navigation to edit page
    const handleEdit = useCallback((currentTeacher: TeacherDisplayType) => {
        router.push(`/dashboard/${role}/teachers/${currentTeacher.id}/edit`);
    }, [role, router]);

    // A helper function to display action body
    const actionBody = useCallback(
        (row: TeacherDisplayType) => (
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
    const getOverlayActions = useCallback((currentTeacher: TeacherDisplayType) => {
        return [
            {
                label: "View",
                icon: <Eye className="w-4 h-4 mr-2" />,
                action: () => currentTeacher && handleView(currentTeacher)
            },
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => currentTeacher && handleEdit(currentTeacher)
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentTeacher && deleteOne(currentTeacher.id)
            },
        ];
    }, [deleteOne, handleEdit, handleView]);

    // Loading effect for initial load
    if (isLoading && !teachers.length) {
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
            {isDeleting && (
                <Spinner visible onHide={() => deleteMutation.reset()} />
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

                {/* Search input section */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search teachers..."
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
                        value={teachers}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        // enable global filter to search these computed fields
                        globalFilterFields={["fullname", "emailAddress", "phoneNumber", "qualificationText", "genderText"]}
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        selection={selected}
                        onSelectionChange={e => setSelected(e.value)}
                        loading={isLoading || isFetching}
                        emptyMessage="No teachers found."
                        selectionMode="multiple"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />

                        <Column
                            field="fullname"
                            header="Name"
                            body={(rowData: TeacherDisplayType) => rowData?.fullname || `${rowData?.firstname || ''} ${rowData?.surname || ''}`.trim() || '–'}
                            sortable
                            filter
                            filterMatchMode={FilterMatchMode.CONTAINS}
                        />

                        <Column field="emailAddress" header="Email" sortable filter filterMatchMode={FilterMatchMode.CONTAINS} />
                        <Column field="phoneNumber" header="Phone" sortable filter filterMatchMode={FilterMatchMode.CONTAINS} />
                        <Column field="genderText" header="Gender" sortable filter filterMatchMode={FilterMatchMode.CONTAINS} />
                        <Column field="qualificationText" header="Qualification" body={(rowData: TeacherDisplayType) => rowData?.qualificationText || '–'} sortable filter filterMatchMode={FilterMatchMode.CONTAINS} />

                        {permit && (
                            <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                        )}
                    </DataTable>
                </div>
            </div>
            {selected.length > 0 && permit && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} teacher(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
                        loading={isDeleting}
                        disabled={isDeleting}
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

export default Teachers;