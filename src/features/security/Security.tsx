"use client";

import React, { useState, useRef } from "react";
import { FaCog, FaPlus, FaBell, FaEye, FaBook } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useForm, Controller } from "react-hook-form";

type SecurityProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

type FormValues = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
};

const Security: React.FC<SecurityProps> = ({
    title = "Feature coming soon",
    subtitle = "This section is currently being developed. Check back later or preview the layout.",
    ctaLabel = "Get notified",
    showSidebar = true,
}) => {
    const { data: session } = useSession();
    const toast = useRef<Toast | null>(null);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        mode: "onBlur",
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const today = new Date().toLocaleDateString();

    const onSubmit = async (vals: FormValues) => {
        setSaving(true);
        try {
            const res = await fetch("/api/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oldPassword: vals.oldPassword,
                    newPassword: vals.newPassword,
                }),
            });

            const json = await (res.ok ? res.json().catch(() => ({})) : res.json().catch(() => ({})));

            if (!res.ok) {
                const message = json?.error || json?.message || `Failed to change password (${res.status})`;
                toast.current?.show({ severity: "error", summary: "Error", detail: message, life: 5000 });
                return;
            }

            toast.current?.show({ severity: "success", summary: "Success", detail: "Password changed successfully.", life: 4000 });
            reset();
            setDialogVisible(false);
        } catch (err: any) {
            console.error("change password error", err);
            toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "Failed to change password", life: 5000 });
        } finally {
            setSaving(false);
        }
    };

    const openDialog = () => setDialogVisible(true);
    const closeDialog = () => {
        setDialogVisible(false);
        reset();
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 lg:p-12">
            <Toast ref={toast} />

            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <FaCog className="w-8 h-8" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={openDialog}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                        >
                            <FaPlus className="w-4 h-4" />
                            Change password
                        </button>

                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl shadow hover:shadow-lg text-sm font-medium transition opacity-80 cursor-not-allowed"
                            disabled
                        >
                            <FaBell className="w-4 h-4" />
                            Notify
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <article className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Under Construction</h2>
                            <span className="text-sm text-indigo-600 font-medium">Preview</span>
                        </div>

                        <p className="text-gray-600 mb-6">{subtitle}</p>

                        <div className="space-y-3">
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full bg-indigo-500 w-1/3 transition-all" />
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <FaEye className="w-4 h-4" />
                                <span>Preview layout</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 inline-flex items-center gap-2">
                                    <FaEye />
                                    Preview layout
                                </button>
                                <button className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 inline-flex items-center gap-2">
                                    <FaBook />
                                    Docs
                                </button>
                            </div>
                        </div>
                    </article>

                    {showSidebar && (
                        <aside className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick info</h3>
                            <dl className="text-sm text-gray-600 space-y-3">
                                <div>
                                    <dt className="font-medium text-gray-800">Items</dt>
                                    <dd className="text-gray-500">—</dd>
                                </div>

                                <div>
                                    <dt className="font-medium text-gray-800">Pending</dt>
                                    <dd className="text-gray-500">—</dd>
                                </div>

                                <div>
                                    <dt className="font-medium text-gray-800">Last update</dt>
                                    <dd className="text-gray-500">{today}</dd>
                                </div>
                            </dl>

                            <div className="mt-6">
                                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-semibold hover:brightness-110 transition flex items-center justify-center gap-2">
                                    <FaBell />
                                    {ctaLabel}
                                </button>
                            </div>
                        </aside>
                    )}
                </section>

                <footer className="mt-10 text-center text-xs text-gray-400">© {new Date().getFullYear()} — Habnaj International Schools</footer>
            </div>

            {/* Change password dialog */}
            <Dialog header="Change password" visible={dialogVisible} style={{ width: "420px" }} onHide={closeDialog} modal>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Old password</label>
                        <Controller
                            control={control}
                            name="oldPassword"
                            rules={{ required: "Old password is required" }}
                            render={({ field }) => (
                                <Password
                                    name={field.name}
                                    value={field.value ?? ""}
                                    onChange={(e: any) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    toggleMask
                                    feedback={false}
                                    className={errors.oldPassword ? "p-invalid w-full" : "w-full"}
                                    inputClassName="w-full"
                                />
                            )}
                        />
                        {errors.oldPassword && <small className="p-error">{errors.oldPassword.message}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                        <Controller
                            control={control}
                            name="newPassword"
                            rules={{
                                required: "New password is required",
                                minLength: { value: 8, message: "Password must be at least 8 characters" },
                                validate: (v) => (v !== watch("oldPassword") ? true : "New password must differ from old password"),
                            }}
                            render={({ field }) => (
                                <Password
                                    name={field.name}
                                    value={field.value ?? ""}
                                    onChange={(e: any) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    toggleMask
                                    feedback
                                    className={errors.newPassword ? "p-invalid w-full" : "w-full"}
                                    inputClassName="w-full"
                                />
                            )}
                        />
                        {errors.newPassword && <small className="p-error">{errors.newPassword.message}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                        <Controller
                            control={control}
                            name="confirmPassword"
                            rules={{
                                required: "Confirm password is required",
                                validate: (v) => v === watch("newPassword") || "Passwords do not match",
                            }}
                            render={({ field }) => (
                                <Password
                                    name={field.name}
                                    value={field.value ?? ""}
                                    onChange={(e: any) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    toggleMask
                                    feedback={false}
                                    className={errors.confirmPassword ? "p-invalid w-full" : "w-full"}
                                    inputClassName="w-full"
                                />
                            )}
                        />
                        {errors.confirmPassword && <small className="p-error">{errors.confirmPassword.message}</small>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" label="Cancel" className="p-button-text" onClick={closeDialog} disabled={saving} />
                        <Button type="submit" label={saving ? "Saving..." : "Save"} className="p-button-primary" loading={saving} />
                    </div>
                </form>
            </Dialog>
        </main>
    );
};

export default Security;
