import React, { useState, useEffect, useRef, useCallback } from "react";
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

import { Administration } from "@/generated/prisma";
import Spinner from "@/components/Spinner/Spinner";

type AdminsProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const Admins: React.FC<AdminsProps> = ({
    title = "System Administrators",
    subtitle = "Records of the school's system administrators.",
}) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [admins, setAdmins] = useState<any[]>([]);
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
    const currentUserId = session?.user?.id;

    // Display admins record on mount
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

    // Fetch admins data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/administrations");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            let filteredData = role.toLowerCase() === 'super'
                ? data?.data
                : data?.data.filter((admin: any) => ['admin'].includes(admin.role.toLowerCase()));
            // Exclude the current user from the displayed data
            if (currentUserId) {
                filteredData = filteredData.filter((admin: any) => admin.id !== currentUserId);
            }
            setAdmins(filteredData);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch admins record, please try again.");
        } finally {
            setLoading(false);
        }
    };

    // A helper function to make api call to delete records
    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/administrations?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    // A helper function to make api call to update role or status
    const updateAdminApi = async (admin: any, updates: { role?: string, active?: boolean }) => {
        const updatedAdminData = { ...admin, ...updates };
        const res = await fetch(`/api/administrations/${admin.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedAdminData),
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
                        setAdmins(prev => prev.filter(s => !ids.includes(s.id)));
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

    // A helper function to update role
    const updateRole = useCallback(
        (admin: any, newRole: string) => {
            setUpdatingIds([admin.id]);
            updateAdminApi(admin, { role: newRole })
                .then((updatedAdmin) => {
                    setAdmins(prev =>
                        prev.map(a =>
                            a.id === admin.id ? { ...a, role: newRole } : a
                        )
                    );
                    show("success", "Role Updated", `Role has been changed to ${newRole} successfully.`);
                })
                .catch((err) => {
                    show("error", "Update Error", err.message || "Failed to update role.");
                })
                .finally(() => {
                    setUpdatingIds([]);
                    panel.current?.hide();
                });
        },
        [show]
    );

    // A helper function to update status
    const updateStatus = useCallback(
        (admin: any, newStatus: boolean) => {
            setUpdatingIds([admin.id]);
            updateAdminApi(admin, { active: newStatus })
                .then((updatedAdmin) => {
                    setAdmins(prev =>
                        prev.map(a =>
                            a.id === admin.id ? { ...a, active: newStatus } : a
                        )
                    );
                    show("success", "Status Updated", `Admin has been ${newStatus ? 'enabled' : 'disabled'} successfully.`);
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
        router.push(`/dashboard/${role}/admins/new`);
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
    const getOverlayActions = useCallback((currentAdmin: any) => {
        const allActions = [
            {
                label: "Admin",
                icon: <User className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && updateRole(currentAdmin, "Admin")
            },
            {
                label: "Super",
                icon: <Shield className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && updateRole(currentAdmin, "Super")
            },
            {
                label: currentAdmin?.active ? "Disable" : "Enable",
                icon: currentAdmin?.active ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && updateStatus(currentAdmin, !currentAdmin.active)
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && deleteOne(currentAdmin.id)
            },
        ];

        // Filter out the current admin's role from the actions
        const filteredActions = allActions.filter(action =>
            action.label.toLowerCase() !== currentAdmin?.role.toLowerCase()
        );

        // For non-Super users, also filter out the Super option
        return role.toLowerCase() === 'super'
            ? filteredActions
            : filteredActions.filter(action => action.label.toLowerCase() !== 'super');
    }, [role, updateRole, updateStatus, deleteOne]);

    // A helper function to display status
    const statusBodyTemplate = useCallback((row: Administration) => (
        <span className="flex items-center justify-center">
            <Tag value={row.active ? 'Active' : 'Disabled'} severity={row.active ? 'success' : 'danger'} className="capitalize w-full py-1.5" />
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
                            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                    </div>

                    {role.toLocaleLowerCase() === 'super' && (<div className="flex gap-3">
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
                            placeholder="Search admins..."
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
                        value={admins}
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
                        emptyMessage="No admins found."
                        selectionMode="multiple"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                        <Column field='email' header='Email' sortable />
                        <Column field='username' header='Username' body={(rowData) => rowData.username || '–'} />
                        <Column
                            field="role"
                            header="Role"
                            body={(rowData) => rowData.role.charAt(0).toUpperCase() + rowData.role.slice(1)}
                            sortable
                            style={{ width: "10rem" }}
                        />
                        <Column
                            header="Status"
                            body={statusBodyTemplate}
                        />
                        <Column
                            field="createdAt"
                            header="Created On"
                            body={(rowData) => moment(rowData.createdAt).format("MMM D, YYYY")}
                            sortable
                        />
                        {role.toLocaleLowerCase() === 'super' && (<Column body={actionBody} header="Actions" style={{ textAlign: 'center', width: '4rem' }} />)}
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
                            <span className="ml-2">{`${label === 'Admin' || label === 'Super' ? 'Make ' + label : label}`}</span>
                        </Button>
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Admins;