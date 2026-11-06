import React, { useState, useRef, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { User, Shield, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
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

import Spinner from "@/components/Spinner/Spinner";
import {
    useGetAdministrations,
    useUpdateAdministration,
    useDeleteAdministrations
} from "@/hooks/useAdministrations";
import type { Administration } from "@/generated/prisma";

type AdminsProps = {
    title?: string;
    subtitle?: string;
};

const Admins: React.FC<AdminsProps> = ({
    title = "System Administrators",
    subtitle = "Records of the school's system administrators."
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [selected, setSelected] = useState<Administration[]>([]);
    const [current, setCurrent] = useState<Administration | null>(null);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData
    });

    const role = session?.user?.role || "Guest";
    const currentUserId = session?.user?.id;

    // Fetch admins via React Query hook
    const { data: adminsData, isLoading, error, } = useGetAdministrations();

    const updateAdminMutation = useUpdateAdministration();
    const deleteAdminMutation = useDeleteAdministrations();

    const show = useCallback((type: "success" | "error", title: string, message: string) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    const filteredAdmins = React.useMemo(() => {
        if (!adminsData) return [];
        let data = role.toLowerCase() === "super"
            ? adminsData
            : adminsData.filter(admin => ['admin'].includes(admin.role.toLowerCase()));

        if (currentUserId) {
            data = data.filter(admin => admin.id !== currentUserId);
        }
        return data;
    }, [adminsData, role, currentUserId]);

    const confirmDelete = useCallback((ids: string[]) => {
        confirmDialog({
            message: ids.length === 1
                ? "Do you really want to delete this record?"
                : `Do you really want to delete these ${ids.length} records?`,
            header: "Confirm Deletion",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            rejectClassName: "p-button-text",
            accept: async () => {
                setDeletingIds(ids);
                deleteAdminMutation.mutate(ids, {
                    onSuccess: () => {
                        show("success", "Deleted", ids.length === 1
                            ? "Record deleted successfully."
                            : `${ids.length} records deleted successfully.`);
                        setSelected(prev => prev.filter(a => !ids.includes(a.id)));
                    },
                    onError: (err: any) => show("error", "Deletion Error", err.message || "Failed to delete record."),
                    onSettled: () => setDeletingIds([])
                });
            }
        });
    }, [deleteAdminMutation, show]);

    const updateRole = useCallback((admin: Administration, newRole: Administration['role']) => {
        setUpdatingIds([admin.id]);
        updateAdminMutation.mutate(
            { id: admin.id, data: { role: newRole } },
            {
                onSuccess: () => {
                    show("success", "Role Updated", `Role has been changed to ${newRole}.`);
                },
                onError: (err: any) => show("error", "Update Error", err.message || "Failed to update role."),
                onSettled: () => setUpdatingIds([])
            }
        );
        panel.current?.hide();
    }, [updateAdminMutation, show]);

    const updateStatus = useCallback((admin: Administration, newStatus: boolean) => {
        setUpdatingIds([admin.id]);
        updateAdminMutation.mutate(
            { id: admin.id, data: { active: newStatus } },
            {
                onSuccess: () => {
                    show("success", "Status Updated", `Admin has been ${newStatus ? 'enabled' : 'disabled'}.`);
                },
                onError: (err: any) => show("error", "Update Error", err.message || "Failed to update status."),
                onSettled: () => setUpdatingIds([])
            }
        );
        panel.current?.hide();
    }, [updateAdminMutation, show]);

    const deleteOne = useCallback((id: string) => confirmDelete([id]), [confirmDelete]);

    const handleNew = useCallback(() => router.push(`/dashboard/${role}/admins/new`), [router, role]);

    const actionBody = useCallback((row: Administration) => (
        <Button
            icon="pi pi-ellipsis-v"
            className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
            onClick={e => {
                setCurrent(row);
                panel.current?.toggle(e);
            }}
            disabled={updatingIds.includes(row.id)}
        />
    ), [updatingIds]);

    const getOverlayActions = useCallback((currentAdmin: Administration) => {
        const allActions = [
            { label: "Admin", icon: <User className="w-4 h-4 mr-2" />, action: () => updateRole(currentAdmin, "Admin") },
            { label: "Super", icon: <Shield className="w-4 h-4 mr-2" />, action: () => updateRole(currentAdmin, "Super") },
            { label: currentAdmin.active ? "Disable" : "Enable", icon: currentAdmin.active ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />, action: () => updateStatus(currentAdmin, !currentAdmin.active) },
            { label: "Delete", icon: <Trash2 className="w-4 h-4 mr-2" />, action: () => deleteOne(currentAdmin.id) },
        ];

        const filteredActions = allActions.filter(action =>
            action.label.toLowerCase() !== currentAdmin.role.toLowerCase()
        );

        return role.toLowerCase() === "super" ? filteredActions : filteredActions.filter(a => a.label.toLowerCase() !== "super");
    }, [role, updateRole, updateStatus, deleteOne]);

    const statusBodyTemplate = useCallback((row: Administration) => (
        <span className="flex items-center justify-center">
            <Tag value={row.active ? 'Active' : 'Disabled'} severity={row.active ? 'success' : 'danger'} className="capitalize w-full py-1.5" />
        </span>
    ), []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }
    if (error) show("error", "Fetch Error", error.message || "Failed to fetch admins.");

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(deletingIds.length > 0 || updatingIds.length > 0) && <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />}
            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Page header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                    </div>

                    {role.toLowerCase() === 'super' && (
                        <Button label="Create" icon={<FaPlus />} className="inline-flex items-center gap-2 px-4 py-2" onClick={handleNew} />
                    )}
                </header>

                {/* Search input section */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search admins..."
                            onInput={e => setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })}
                            className="w-full rounded px-8 py-2"
                        />
                    </span>
                </div>

                {/* DataTable */}
                <DataTable
                    value={filteredAdmins}
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
                    loading={isLoading}
                    emptyMessage="No admins found."
                    selectionMode="multiple"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                    <Column field='email' header='Email' sortable />
                    <Column field='username' header='Username' body={row => row.username || '–'} />
                    <Column field="role" header="Role" body={row => row.role.charAt(0).toUpperCase() + row.role.slice(1)} sortable style={{ width: "10rem" }} />
                    <Column header="Status" body={statusBodyTemplate} />
                    <Column field="createdAt" header="Created On" body={row => moment(row.createdAt).format("MMM D, YYYY")} sortable />
                    {role.toLowerCase() === 'super' && <Column body={actionBody} header="Actions" style={{ textAlign: 'center', width: '4rem' }} />}
                </DataTable>

                {selected.length > 0 && (
                    <Button
                        label={`Delete ${selected.length} record(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0 || updatingIds.length > 0}
                    />
                )}
            </div>

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
                            <span className="ml-2">{label === 'Admin' || label === 'Super' ? 'Make ' + label : label}</span>
                        </Button>
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Admins;
