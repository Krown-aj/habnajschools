"use client";

import React, { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { administrationSchema, AdministrationSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

const NewAdmin: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();

    const role = session?.user?.role || 'Guest';

    // Define role options based on current user's role
    const roleOptions = role.toLowerCase() === 'super'
        ? [
            { label: "Admin", value: "Admin" },
            { label: "Super", value: "Super" },
        ]
        : [
            { label: "Admin", value: "Admin" },
        ];

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(administrationSchema),
        mode: "onBlur",
        defaultValues: {
            email: "",
            role: "Admin",
            password: "password",
        },
    });

    // A helper function to handle toast display
    const show = (
        severity: "success" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    // A helper function to handle back navigation
    const handleBack = () => {
        router.back();
    };

    // A function to submit data to api for saving
    const onSubmit = async (data: AdministrationSchema) => {
        setLoading(true);
        try {
            const res = await fetch("/api/administrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            setLoading(false);
            if (res.ok) {
                show("success", "Admin Created", "New Admin has been created successfully.");
                setTimeout(() => {
                    reset();
                    router.back();
                }, 1500);
            } else {
                show("error", "Creation Error", result.error || result.message || "Failed to create new admin record, please try again.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create new admin record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md ">
            <Toast ref={toast} />
            {loading && <Spinner visible onHide={() => setLoading(false)} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New System Administrator</h2>
                <Button label="Back" icon="pi pi-arrow-left" className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300" onClick={handleBack} />
            </div>
            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    <div className="p-field">
                        <label htmlFor="email">Email Address</label>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="email"
                                    type="email"
                                    placeholder="Enter email address"
                                    className={errors.email ? 'p-invalid' : ''}
                                    autoComplete="email"
                                />
                            )}
                        />
                        {errors.email && <small className="p-error">{errors.email.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="role">Role</label>
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="role"
                                    {...field}
                                    options={roleOptions}
                                    placeholder="Select Role"
                                    className={errors.role ? "p-invalid w-full" : "w-full"}
                                    onChange={(e) => field.onChange(e.value)}
                                    value={field.value || ""}
                                />
                            )}
                        />
                        {errors.role && <small className="p-error">{errors.role.message}</small>}
                    </div>
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button
                            label="Cancel"
                            type="button"
                            outlined
                            onClick={handleBack}
                        />
                        <Button
                            label="Save"
                            type="submit"
                            className="p-button-primary"
                            loading={loading}
                            disabled={loading}
                        />
                    </div>
                </form>
            </div>
        </section>
    )
};

export default NewAdmin;