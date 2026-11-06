"use client";

import React, { useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { useGetTeachers } from "@/hooks/useTeachers";
import { useCreateClass } from "@/hooks/useClasses";

import { classSchema, ClassSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

/**
 * Static dropdown options
 */
const categoryOptions = [
    { label: "Bronze", value: "Bronze" },
    { label: "Diamond", value: "Diamond" },
    { label: "Gold", value: "Gold" },
    { label: "Platinum", value: "Platinum" },
    { label: "Silver", value: "Silver" },
];

const sectionOptions = [
    { label: "Pre-Nursery", value: "PRE-NURSERY" },
    { label: "Nursery", value: "NURSERY" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
];

const NewClass: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast | null>(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClassSchema>({
        resolver: zodResolver(classSchema),
        mode: "onBlur",
    });

    // Get teachers from react-query hook
    const {
        data: teachers = [],
        isLoading: isLoadingTeachers,
        isError: isTeachersError,
        error: teachersError,
    } = useGetTeachers();

    // Memoize options to avoid remapping on every render
    const teacherOptions = useMemo(
        () =>
            (teachers ?? []).map((t: any) => ({
                label: [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(" ") || "Unknown",
                value: t.id,
            })),
        [teachers]
    );

    // Mutation hook for creating class
    const createClassMutation = useCreateClass();

    // Toast helper
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    // Form submit handler
    const onSubmit = (data: ClassSchema) => {
        const payload = { ...data, name: `${data.name} ${data.category}` };

        createClassMutation.mutate(payload, {
            onSuccess: () => {
                showToast("success", "Class Created", "New class created successfully.");
                setTimeout(() => {
                    reset();
                    router.back();
                }, 1500);
            },
            onError: (err: any) => {
                showToast("error", "Creation Error", err?.message || "Failed to create class. Please try again.");
            },
        });
    };

    const handleBack = () => router.back();

    // If teacher query errored, show toast and render simple fallback
    if (isTeachersError) {
        showToast("error", "Teachers Load Error", (teachersError as any)?.message || "Unable to load teachers.");
    }

    // Loading state while teachers are being fetched
    if (isLoadingTeachers) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />

            {/* show spinner overlay while create mutation is pending */}
            {createClassMutation.isPending && <Spinner visible onHide={() => { }} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Class</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            {/* Form Body */}
            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Name */}
                    <div className="p-field">
                        <label htmlFor="name">Name</label>
                        <InputText id="name" placeholder="Enter name" {...register("name")} className={errors.name ? "p-invalid w-full" : "w-full"} />
                        {errors.name && <small className="p-error">{errors.name.message}</small>}
                    </div>

                    {/* Category */}
                    <div className="p-field">
                        <label htmlFor="category">Class Category</label>
                        <Controller
                            name="category"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown id="category" {...field} options={categoryOptions} placeholder="Select Class Category" className={errors.category ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.category && <small className="p-error">{errors.category.message}</small>}
                    </div>

                    {/* Section */}
                    <div className="p-field">
                        <label htmlFor="section">Section</label>
                        <Controller
                            name="section"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown id="section" {...field} options={sectionOptions} placeholder="Select Section" className={errors.section ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.section && <small className="p-error">{errors.section.message}</small>}
                    </div>

                    {/* Capacity */}
                    <div className="p-field">
                        <label htmlFor="capacity">Capacity</label>
                        <InputText id="capacity" type="number" placeholder="Enter capacity" {...register("capacity", { valueAsNumber: true })} className={errors.capacity ? "p-invalid w-full" : "w-full"} />
                        {errors.capacity && <small className="p-error">{errors.capacity.message}</small>}
                    </div>

                    {/* Form Master */}
                    <div className="p-field">
                        <label htmlFor="formmasterid">Form Master</label>
                        <Controller
                            name="formmasterid"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown id="formmasterid" {...field} options={teacherOptions} placeholder="Select Form Master" className={errors.formmasterid ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.formmasterid && <small className="p-error">{errors.formmasterid.message}</small>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Save" type="submit" className="p-button-primary" loading={createClassMutation.isPending} disabled={createClassMutation.isPending} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default NewClass;
