"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { classSchema, ClassSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

import { useGetTeachers } from "@/hooks/useTeachers";
import { useGetClassById, useUpdateClass } from "@/hooks/useClasses";

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

const EditClass: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast | null>(null);

    const classId = params?.id as string | undefined;

    // Form setup
    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ClassSchema>({
        resolver: zodResolver(classSchema),
        mode: "onBlur",
    });

    // Queries: class detail + teachers list
    const {
        data: classData,
        isPending: isPendingClass,
        isError: isClassError,
        error: classError,
    } = useGetClassById(classId, { enabled: Boolean(classId) });

    const {
        data: teachers = [],
        isPending: isPendingTeachers,
        isError: isTeachersError,
        error: teachersError,
    } = useGetTeachers();

    // Mutation: update class
    const updateClassMutation = useUpdateClass();

    // Map teachers to dropdown options and memoize
    const teacherOptions = useMemo(
        () =>
            (teachers ?? []).map((t: any) => ({
                label: [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(" ") || "Unknown",
                value: t.id,
            })),
        [teachers]
    );

    // Populate form when class data loads
    useEffect(() => {
        if (classData) {
            setValue("name", classData.name ?? "");
            setValue("category", classData.category ?? "");
            setValue("capacity", classData.capacity ?? undefined);
            setValue("section", classData.section ?? "");
            setValue("formmasterid", classData.formmasterid ?? "");
        }
    }, [classData, setValue]);

    // Show errors as toast once
    useEffect(() => {
        if (isClassError && classError) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (classError as any)?.message || "Failed to load class data.",
                life: 4000,
            });
        }
    }, [isClassError, classError]);

    useEffect(() => {
        if (isTeachersError && teachersError) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (teachersError as any)?.message || "Failed to load teachers.",
                life: 4000,
            });
        }
    }, [isTeachersError, teachersError]);

    // Toast helper
    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const handleBack = () => router.back();

    // Submit handler uses mutation hook
    const onSubmit = (data: ClassSchema) => {
        if (!classId) {
            show("error", "Invalid Class", "Class ID is missing.");
            return;
        }

        updateClassMutation.mutate(
            { id: classId, data },
            {
                onSuccess: () => {
                    show("success", "Class Updated", "Class has been updated successfully.");
                    setTimeout(() => router.back(), 1200);
                },
                onError: (err: any) => {
                    show("error", "Update Error", err?.message || "Failed to update class. Please try again.");
                },
            }
        );
    };

    // Global loading: either class detail or teachers
    const isFetching = isPendingClass || isPendingTeachers;
    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {updateClassMutation.isPending && <Spinner visible onHide={() => { }} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Class</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Name Field */}
                    <div className="p-field">
                        <label htmlFor="name" className="block text-gray-400 font-medium mb-2">
                            Name
                        </label>
                        <InputText
                            id="name"
                            placeholder="Enter class name"
                            {...register("name")}
                            className={errors.name ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    {/* Category Field */}
                    <div className="p-field">
                        <label htmlFor="category" className="block text-gray-400 font-medium mb-2">
                            Class Category
                        </label>
                        <Controller
                            name="category"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="category"
                                    {...field}
                                    options={categoryOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select Class Category"
                                    className={errors.category ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                    </div>

                    {/* Section Field */}
                    <div className="p-field">
                        <label htmlFor="section">Section</label>
                        <Controller
                            name="section"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="section"
                                    {...field}
                                    options={sectionOptions}
                                    placeholder="Select Section"
                                    className={errors.section ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.section && <small className="p-error">{errors.section.message}</small>}
                    </div>

                    {/* Capacity Field */}
                    <div className="p-field">
                        <label htmlFor="capacity" className="block text-gray-400 font-medium mb-2">
                            Capacity
                        </label>
                        <InputText
                            id="capacity"
                            type="number"
                            placeholder="Enter capacity"
                            {...register("capacity", { valueAsNumber: true })}
                            className={errors.capacity ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
                    </div>

                    {/* Form Master Field */}
                    <div className="p-field">
                        <label htmlFor="formmasterid" className="block text-gray-400 font-medium mb-2">
                            Form Master
                        </label>
                        <Controller
                            name="formmasterid"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="formmasterid"
                                    {...field}
                                    options={teacherOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select Form Master"
                                    className={errors.formmasterid ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.formmasterid && <p className="text-red-500 text-sm">{errors.formmasterid.message}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button
                            label="Update"
                            type="submit"
                            className="p-button-primary"
                            loading={updateClassMutation.isPending}
                            disabled={updateClassMutation.isPending}
                        />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditClass;
