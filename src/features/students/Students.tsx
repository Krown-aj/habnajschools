"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { Trash2, Edit, Eye } from "lucide-react";
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

import { useGetStudents, useDeleteStudents } from "@/hooks/useStudents";
import { Student as StudentType } from '@/generated/prisma';
import Spinner from "@/components/ui/Spinner/Spinner";

type StudentsProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Students: React.FC<StudentsProps> = ({
    title = "School Students",
    subtitle = "Records of all the students in Habnaj International Schools.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [selected, setSelected] = useState<StudentType[]>([]);
    const [current, setCurrent] = useState<StudentType | null>(null);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || 'Guest';
    const permit = role.toLowerCase() === 'super' || role.toLowerCase() === 'admin' || role.toLowerCase() === 'management';

    // Determine the filtering parameters based on the user role
    const studentQueryParams = useMemo(() => {
        const params: { teacherid?: string; parentid?: string } = {};
        if (role.toLowerCase() === 'teacher' && session?.user?.id) {
            params.teacherid = session.user.id;
        } else if (role.toLowerCase() === 'parent' && session?.user?.id) {
            params.parentid = session.user.id;
        }
        return params;
    }, [role, session?.user?.id]);

    // Use the useGetStudents hook for data fetching
    const {
        data: fetchedStudents,
        isLoading,
        error: fetchError,
    } = useGetStudents(studentQueryParams);

    // Use the useDeleteStudents hook for mutation
    const {
        mutate: deleteStudentsMutation,
        isPending: isDeleting,
    } = useDeleteStudents();


    //  Map the fetched data and memoize for the DataTable
    const students = useMemo(() => {
        if (!fetchedStudents) return [];

        return fetchedStudents.map((s: StudentType & { class?: { name: string } } & any) => ({
            ...s,
            fullname: `${s.firstname || ''} ${s.othername || ''} ${s.surname || ''}`.replace(/\s+/g, ' ').trim(),
            className: s.class?.name || '–'
        }));
    }, [fetchedStudents]);


    // Toast helper function
    const show = useCallback((
        type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
        title: string,
        message: string
    ) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    // Handle initial fetch error
    useEffect(() => {
        if (fetchError) {
            show("error", "Fetch Error", "Failed to fetch students record, please try again.");
        }
    }, [fetchError, show]);

    // A helper function to confirm user's action and trigger mutation
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1
                        ? "Do you really want to delete this student record?"
                        : `Do you really want to delete these ${ids.length} student records?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: () => {
                    interface ErrorLike { message?: string }
                    interface DeleteStudentsMutationOptions {
                        onSuccess?: () => void;
                        onError?: (error: ErrorLike | unknown) => void;
                    }

                    deleteStudentsMutation(ids, {
                        onSuccess: (): void => {
                            show(
                                "success",
                                "Deleted",
                                ids.length === 1
                                    ? "Student record deleted successfully."
                                    : `${ids.length} student records deleted successfully.`
                            );
                            setSelected((prev: StudentType[]) => prev.filter(s => !ids.includes(s.id)));
                        },
                        onError: (err: unknown): void => {
                            const message = (err as ErrorLike)?.message || "Failed to delete student record, please try again.";
                            show("error", "Deletion Error", message);
                        },
                    } as DeleteStudentsMutationOptions);
                },
            });
        },
        [show, deleteStudentsMutation]
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
        router.push(`/dashboard/${role}/students/new`);
    }, [router, role]);

    // A helper function to handle navigation to view page
    const handleView = useCallback((currentStudent: StudentType) => {
        router.push(`/dashboard/${role}/students/${currentStudent?.id}/view`);
    }, [router, role]);

    // A helper function to handle navigation to edit page
    const handleEdit = useCallback((currentStudent: StudentType) => {
        router.push(`/dashboard/${role}/students/${currentStudent?.id}/edit`);
    }, [router, role]);

    // A helper function to display action body
    const actionBody = useCallback(
        (row: StudentType) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={e => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
                disabled={isDeleting}
            />
        ),
        [isDeleting]
    );

    // A helper function to display context menu
    const getOverlayActions = useCallback((currentStudent: StudentType) => {
        if (permit) {
            return [
                {
                    label: "View",
                    icon: <Eye className="w-4 h-4 mr-2" />,
                    action: () => currentStudent && handleView(currentStudent)
                },
                {
                    label: "Edit",
                    icon: <Edit className="w-4 h-4 mr-2" />,
                    action: () => currentStudent && handleEdit(currentStudent)
                },
                {
                    label: "Delete",
                    icon: <Trash2 className="w-4 h-4 mr-2" />,
                    action: () => currentStudent && deleteOne(currentStudent.id)
                }
            ];
        }
        return [
            {
                label: "View",
                icon: <Eye className="w-4 h-4 mr-2" />,
                action: () => currentStudent && handleView(currentStudent)
            },
        ];
    }, [permit, deleteOne, handleEdit, handleView]);

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
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {isDeleting && (
                <Spinner visible />
            )}
            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Page header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" />
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
                            placeholder="Search students..."
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
                        value={students}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        globalFilterFields={["admissionnumber", "fullname", "gender", "section", "className"]}
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        selection={selected}
                        onSelectionChange={e => setSelected(e.value)}
                        loading={isLoading || isDeleting}
                        emptyMessage="No students found."
                        selectionMode="multiple"
                    >
                        {permit && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}

                        <Column field="admissionnumber" header="Admission Number" sortable />

                        <Column
                            field="fullname"
                            header="Name"
                            body={(rowData: StudentType) => (rowData as any).fullname || '–'}
                            sortable
                            filter
                            filterMatchMode={FilterMatchMode.CONTAINS}
                        />

                        <Column field="gender" header="Gender" sortable />
                        <Column field="section" header="Section" sortable />

                        <Column
                            field="className"
                            header="Class"
                            body={(rowData: StudentType) => (rowData as any).className || '–'}
                            sortable
                            filter
                            filterMatchMode={FilterMatchMode.CONTAINS}
                        />

                        <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                    </DataTable>
                </div>
            </div>
            {selected.length > 0 && permit && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} student(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
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
                            disabled={isDeleting}
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

export default Students;