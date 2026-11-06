"use client";

import React, { useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { subjectSchema, SubjectSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

import { useGetTeachers } from "@/hooks/useTeachers";
import { useCreateSubject } from "@/hooks/useSubjects";

interface Option {
    label: string;
    value: string;
}

const categoryOptions = [
    { label: "Arts", value: "Arts" },
    { label: "General", value: "General" },
    { label: "Science", value: "Science" },
    { label: "Social-Sciences", value: "Social-Sciences" },
];

const sectionOptions = [
    { label: "Pre-Nursery", value: "PRE-NURSERY" },
    { label: "Nursery", value: "NURSERY" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
];

const NewSubject: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast | null>(null);

    // Form
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SubjectSchema>({
        resolver: zodResolver(subjectSchema),
        mode: "onBlur",
    });

    // Teachers query 
    const {
        data: teachers = [],
        isPending: isPendingTeachers,
        isError: isTeachersError,
        error: teachersError,
    } = useGetTeachers();

    // Create subject mutation 
    const createSubjectMutation = useCreateSubject();

    // Memoize teacher options for dropdown / multiselect
    const teacherOptions = useMemo<Option[]>(
        () =>
            (teachers ?? []).map((t: any) => ({
                label:
                    [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(" ").trim() || "Unknown",
                value: t.id,
            })),
        [teachers]
    );

    // Helper to show toast
    const show = (severity: "success" | "error", summary: string, detail: string) =>
        toast.current?.show({ severity, summary, detail, life: 3000 });

    // If teacher query errored, show toast once (non-blocking)
    if (isTeachersError) {
        show("error", "Teachers Load Error", (teachersError as any)?.message || "Failed to load teachers.");
    }

    // Submit handler uses the mutation hook
    const onSubmit = (data: SubjectSchema) => {
        createSubjectMutation.mutate(data, {
            onSuccess: () => {
                show("success", "Subject Created", "New subject has been created successfully.");
                setTimeout(() => {
                    reset();
                    router.back();
                }, 1200);
            },
            onError: (err: any) => {
                show("error", "Creation Error", err?.message || "Failed to create new subject record, please try again.");
            },
        });
    };

    const handleBack = () => router.back();

    // Show loading screen while teachers are loading (so the MultiSelect has options)
    if (isPendingTeachers) {
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
            {createSubjectMutation.isPending && <Spinner visible onHide={() => { }} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Subject</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Name */}
                    <div className="p-field">
                        <label htmlFor="name">Name</label>
                        <InputText id="name" placeholder="Enter subject name" {...register("name")} className={errors.name ? "p-invalid w-full" : "w-full"} />
                        {errors.name && <small className="p-error">{errors.name.message}</small>}
                    </div>

                    {/* Category */}
                    <div className="p-field">
                        <label htmlFor="category">Subject Category</label>
                        <Controller
                            name="category"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown id="category" {...field} options={categoryOptions} placeholder="Select Subject Category" className={errors.category ? "p-invalid w-full" : "w-full"} />
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

                    {/* Teachers (filterable MultiSelect) */}
                    <div className="p-field">
                        <label htmlFor="teacherIds">Teachers</label>
                        <Controller
                            name="teacherIds"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => (
                                <MultiSelect
                                    id="teacherIds"
                                    {...field}
                                    options={teacherOptions}
                                    placeholder="Select Teachers"
                                    className={errors.teacherIds ? "p-invalid w-full" : "w-full"}
                                    display="chip"
                                    filter
                                    filterPlaceholder="Search teachers..."
                                    optionLabel="label"
                                    optionValue="value"
                                    maxSelectedLabels={3}
                                />
                            )}
                        />
                        {errors.teacherIds && <small className="p-error">{errors.teacherIds.message}</small>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Save" type="submit" className="p-button-primary" loading={createSubjectMutation.isPending} disabled={createSubjectMutation.isPending} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default NewSubject;
