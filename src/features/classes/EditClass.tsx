"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

const EditClass: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [teachers, setTeachers] = useState<Option[]>([]);
    const classId = params.id;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(classSchema),
        mode: "onBlur",
    });

    // Fetch class and teacher data concurrently
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setFetching(true);
            try {
                if (!classId) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Invalid Class",
                        detail: "Class ID is missing.",
                        life: 3000,
                    });
                    return;
                }

                const [classResponse, teachersResponse] = await Promise.all([
                    fetch(`/api/classes/${classId}`, { signal }),
                    fetch("/api/teachers", { signal }),
                ]);

                // Handle class response
                if (!classResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load class data.",
                        life: 3000,
                    });
                    return;
                }
                const classPayload = await classResponse.json();
                if (!classPayload) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Class response format invalid.",
                        life: 3000,
                    });
                    return;
                }
                const classData = classPayload;
                setValue("name", classData.name);
                setValue("category", classData.category);
                setValue("capacity", classData.capacity);
                setValue("formmasterid", classData.formmasterid);

                // Handle teachers response
                if (!teachersResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load teachers.",
                        life: 3000,
                    });
                    return;
                }
                const teachersPayload = await teachersResponse.json();
                if (!teachersPayload || !Array.isArray(teachersPayload.data)) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Teachers response format invalid.",
                        life: 3000,
                    });
                    return;
                }
                const formattedTeachers: Option[] = teachersPayload.data.map((t: any) => ({
                    label: [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(" ") || "Unknown",
                    value: t.id,
                }));
                setTeachers(formattedTeachers);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Unexpected fetch error:", err);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "An unexpected error occurred while loading data.",
                    life: 3000,
                });
            } finally {
                setFetching(false);
            }
        };

        if (classId) {
            fetchData();
        }

        return () => controller.abort();
    }, [classId, setValue]);

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

    // A function to submit data to api for updating
    const onSubmit = async (data: ClassSchema) => {
        setLoading(true);
        try {
            if (!classId) {
                show("error", "Invalid Class", "Class ID is missing.");
                setLoading(false);
                return;
            }

            const payload = { ...data };
            const res = await fetch(`/api/classes/${classId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            setLoading(false);
            if (res.ok) {
                show("success", "Class Updated", "Class has been updated successfully.");
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                show("error", "Update Error", result.error || result.message || "Failed to update class record, please try again.");
            }
        } catch (err: any) {
            show("error", "Update Error", err.message || "Could not update class record.");
        } finally {
            setLoading(false);
        }
    };

    // Loading effect during fetching
    if (fetching) {
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
            {loading && <Spinner visible onHide={() => setLoading(false)} />}
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
                        <label htmlFor="name" className="block text-gray-400 font-medium mb-2">Name</label>
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
                        <label htmlFor="category" className="block text-gray-400 font-medium mb-2">Class Category</label>
                        <Controller
                            name="category"
                            control={control}
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

                    {/* Capacity Field */}
                    <div className="p-field">
                        <label htmlFor="capacity" className="block text-gray-400 font-medium mb-2">Capacity</label>
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
                        <label htmlFor="formmasterid" className="block text-gray-400 font-medium mb-2">Form Master</label>
                        <Controller
                            name="formmasterid"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="formmasterid"
                                    {...field}
                                    options={teachers}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select Form Master"
                                    className={errors.formmasterid ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.formmasterid && <p className="text-red-500 text-sm">{errors.formmasterid.message}</p>}
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
                            label="Update"
                            type="submit"
                            className="p-button-primary"
                            loading={loading}
                            disabled={loading}
                        />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditClass;