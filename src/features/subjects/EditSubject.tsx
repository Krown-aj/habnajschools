"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { subjectSchema, SubjectSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

// Define option interface
interface Option {
    label: string;
    value: string;
}

// Define subject categories for dropdown
const categoryOptions = [
    { label: "Arts", value: "Arts" },
    { label: "General", value: "General" },
    { label: "Science", value: "Science" },
    { label: "Social-Sciences", value: "Social-Sciences" },
];

const EditSubject: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [teachers, setTeachers] = useState<Option[]>([]);
    const subjectId = params.id;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(subjectSchema),
        mode: "onBlur",
    });

    // Fetch subject and teacher data concurrently
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setFetching(true);
            try {
                if (!subjectId) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Invalid Subject",
                        detail: "Subject ID is missing.",
                        life: 3000,
                    });
                    return;
                }

                const [subjectResponse, teachersResponse] = await Promise.all([
                    fetch(`/api/subjects/${subjectId}`, { signal }),
                    fetch("/api/teachers", { signal }),
                ]);

                // Handle subject response
                if (!subjectResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load subject data.",
                        life: 3000,
                    });
                    return;
                }
                const subjectPayload = await subjectResponse.json();
                if (!subjectPayload) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Subject response format invalid.",
                        life: 3000,
                    });
                    return;
                }
                const subjectData = subjectPayload.data || subjectPayload;
                setValue("name", subjectData.name);
                setValue("category", subjectData.category);
                setValue("teacherIds", subjectData.teachers?.map((t: any) => t.id) || []);

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

        if (subjectId) {
            fetchData();
        }

        return () => controller.abort();
    }, [subjectId, setValue]);

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

    // A function to submit data to API for updating
    const onSubmit = async (data: SubjectSchema) => {
        setLoading(true);
        try {
            if (!subjectId) {
                show("error", "Invalid Subject", "Subject ID is missing.");
                setLoading(false);
                return;
            }

            const payload = { ...data };
            const res = await fetch(`/api/subjects/${subjectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Subject Updated", "Subject has been updated successfully.");
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                show("error", "Update Error", result.error || result.message || "Failed to update subject record, please try again.");
            }
        } catch (err: any) {
            show("error", "Update Error", err.message || "Could not update subject record.");
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
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Subject</h2>
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
                            placeholder="Enter subject name"
                            {...register("name")}
                            className={errors.name ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    {/* Category Field */}
                    <div className="p-field">
                        <label htmlFor="category" className="block text-gray-400 font-medium mb-2">Subject Category</label>
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
                                    placeholder="Select Subject Category"
                                    className={errors.category ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                    </div>

                    {/* Teachers Field */}
                    <div className="p-field">
                        <label htmlFor="teacherIds" className="block text-gray-400 font-medium mb-2">Teachers</label>
                        <Controller
                            name="teacherIds"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    id="teacherIds"
                                    {...field}
                                    options={teachers}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select Teachers"
                                    className={errors.teacherIds ? "p-invalid w-full" : "w-full"}
                                    display="chip"
                                />
                            )}
                        />
                        {errors.teacherIds && <p className="text-red-500 text-sm">{errors.teacherIds.message}</p>}
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

export default EditSubject;