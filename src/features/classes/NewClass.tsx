"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { classSchema, ClassSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

// Define option interface
interface Option {
    label: string;
    value: string;
}

// Define class categories for dropdown
const categoryOptions = [
    { label: "Bronze", value: "Bronze" },
    { label: "Diamond", value: "Diamond" },
    { label: "Gold", value: "Gold" },
    { label: "Platinum", value: "Platinum" },
    { label: "Silver", value: "Silver" },

];

const NewClass: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<Option[]>([]);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(classSchema),
        mode: "onBlur",
    });

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        (async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/teachers', { signal });
                if (!res.ok) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Fetching Error',
                        detail: 'Failed to load teachers.',
                        life: 3000,
                    });
                    return;
                }

                const payload = await res.json();
                if (!payload || !Array.isArray(payload.data)) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Parsing Error',
                        detail: 'Teachers response format invalid.',
                        life: 3000,
                    });
                    return;
                }

                const formattedTeachers: Option[] = payload.data.map((t: any) => ({
                    label: [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(' ') || 'Unknown',
                    value: t.id,
                }));

                setTeachers(formattedTeachers);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                console.error('Unexpected fetch error:', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'An unexpected error occurred.',
                    life: 3000,
                });
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

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
    const onSubmit = async (data: ClassSchema) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                name: `${data.name} ${data.category}`,
            };
            const res = await fetch("/api/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            setSaving(false);
            if (res.ok) {
                show("success", "Class Created", "New Class has been created successfully.");
                setTimeout(() => {
                    reset();
                    router.back();
                }, 1500);
            } else {
                show("error", "Creation Error", result.error || result.message || "Failed to create new class record, please try again.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create new class record.");
        } finally {
            setSaving(false);
        }
    };

    // Loading effect during fetching
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
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md ">
            <Toast ref={toast} />
            {saving && <Spinner visible onHide={() => setSaving(false)} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Class</h2>
                <Button label="Back" icon="pi pi-arrow-left" className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300" onClick={handleBack} />
            </div>
            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Name field */}
                    <div className="p-field">
                        <label htmlFor="name">Name</label>
                        <InputText
                            id="name"
                            placeholder="Enter name"
                            {...register("name")}
                            className={errors.name ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.name && <small className="p-error">{errors.name.message}</small>}
                    </div>

                    {/* Category Field */}
                    <div className="p-field">
                        <label htmlFor="category">Class Category</label>
                        <Controller
                            name="category"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="category"
                                    {...field}
                                    options={categoryOptions}
                                    placeholder="Select Class Category"
                                    className={errors.category ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.category && <small className="p-error">{errors.category.message}</small>}
                    </div>

                    {/* Capacity Field */}
                    <div className="p-field">
                        <label htmlFor="capacity">Capacity</label>
                        <InputText
                            id="capacity"
                            type="number"
                            placeholder="Enter capacity"
                            {...register("capacity", { valueAsNumber: true })}
                            className={errors.capacity ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.capacity && <small className="p-error">{errors.capacity.message}</small>}
                    </div>

                    {/* Form Master Field */}
                    <div className="p-field">
                        <label htmlFor="formmasterid">Form Master</label>
                        <Controller
                            name="formmasterid"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="formmasterid"
                                    {...field}
                                    options={teachers}
                                    placeholder="Select Form Master"
                                    className={errors.formmasterid ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.formmasterid && <small className="p-error">{errors.formmasterid.message}</small>}
                    </div>

                    {/* Action Buttons */}
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
                            loading={saving}
                            disabled={saving}
                        />
                    </div>
                </form>
            </div>
        </section>
    )
};

export default NewClass;