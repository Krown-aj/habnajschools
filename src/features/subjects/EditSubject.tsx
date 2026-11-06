"use client";

import React, { useEffect, useMemo, useRef } from "react";
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

import { useGetTeachers } from "@/hooks/useTeachers";
import { useGetSubjectById, useUpdateSubject } from "@/hooks/useSubjects";

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

const EditSubject: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast | null>(null);
    const subjectId = params?.id as string | undefined;

    // react-hook-form setup with zod
    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<SubjectSchema>({
        resolver: zodResolver(subjectSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            category: "",
            section: "",
            teacherIds: [],
        },
    });

    // Queries: subject detail & teachers list
    const {
        data: subjectData,
        isPending: isPendingSubject,
        isError: isSubjectError,
        error: subjectError,
    } = useGetSubjectById(subjectId, { enabled: Boolean(subjectId) });

    const {
        data: teachers = [],
        isPending: isPendingTeachers,
        isError: isTeachersError,
        error: teachersError,
    } = useGetTeachers();

    // Mutation: update subject
    const updateMutation = useUpdateSubject();

    // Memoize teachers options for MultiSelect
    const teacherOptions = useMemo(
        () =>
            (teachers ?? []).map((t: any) => ({
                label: [t.title, t.firstname, t.othername, t.surname].filter(Boolean).join(" ").trim() || "Unknown",
                value: t.id,
            })),
        [teachers]
    );

    // Populate form fields when subjectData arrives
    useEffect(() => {
        if (!subjectData) return;
        setValue("name", subjectData.name ?? "");
        setValue("category", subjectData.category ?? "");
        setValue("section", subjectData.section ?? "");
        // If subjectData.teachers is array of teacher objects, map to ids
        const teacherIds = Array.isArray(subjectData.teachers)
            ? subjectData.teachers.map((t: any) => t.id)
            : subjectData.teacherIds ?? [];
        setValue("teacherIds", teacherIds);
    }, [subjectData, setValue]);

    // Show query errors as toast once
    useEffect(() => {
        if (isSubjectError && subjectError) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (subjectError as any)?.message || "Failed to load subject data.",
                life: 4000,
            });
        }
    }, [isSubjectError, subjectError]);

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

    // Back navigation
    const handleBack = () => router.back();

    // Submit handler uses the mutation hook
    const onSubmit = (data: SubjectSchema) => {
        if (!subjectId) {
            show("error", "Invalid Subject", "Subject ID is missing.");
            return;
        }

        updateMutation.mutate(
            { id: subjectId, data },
            {
                onSuccess: () => {
                    show("success", "Subject Updated", "Subject has been updated successfully.");
                    setTimeout(() => router.back(), 1100);
                },
                onError: (err: any) => {
                    show("error", "Update Error", err?.message || "Failed to update subject. Please try again.");
                },
            }
        );
    };

    // Combined loading state while fetching initial data
    const initialLoading = isPendingSubject || isPendingTeachers;

    if (initialLoading) {
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
            {updateMutation.isPending && <Spinner visible onHide={() => { }} />}

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
                        <label htmlFor="name" className="block text-gray-400 font-medium mb-2">
                            Name
                        </label>
                        <InputText id="name" placeholder="Enter subject name" {...register("name")} className={errors.name ? "p-invalid w-full" : "w-full"} />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    {/* Category Field */}
                    <div className="p-field">
                        <label htmlFor="category" className="block text-gray-400 font-medium mb-2">
                            Subject Category
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
                                    placeholder="Select Subject Category"
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
                                <Dropdown id="section" {...field} options={sectionOptions} placeholder="Select Section" className={errors.section ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.section && <small className="p-error">{errors.section.message}</small>}
                    </div>

                    {/* Teachers Field (filterable MultiSelect) */}
                    <div className="p-field">
                        <label htmlFor="teacherIds" className="block text-gray-400 font-medium mb-2">
                            Teachers
                        </label>
                        <Controller
                            name="teacherIds"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => (
                                <MultiSelect
                                    id="teacherIds"
                                    {...field}
                                    options={teacherOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select Teachers"
                                    className={errors.teacherIds ? "p-invalid w-full" : "w-full"}
                                    display="chip"
                                    filter
                                    filterPlaceholder="Search teachers..."
                                    maxSelectedLabels={3}
                                />
                            )}
                        />
                        {errors.teacherIds && <p className="text-red-500 text-sm">{errors.teacherIds.message}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Update" type="submit" className="p-button-primary" loading={updateMutation.isPending} disabled={updateMutation.isPending} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditSubject;
