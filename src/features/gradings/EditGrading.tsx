"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";

import { gradingUpdateSchema, GradingUpdateSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";
import { useGetTerms } from "@/hooks/useTerms";
import { useGetGradingPolicies } from "@/hooks/useGradingPolicies";
import { useGetGradingById, useUpdateGrading, useInvalidateGradings } from "@/hooks/useGradings";

// Define option interface
interface Option {
    label: string;
    value: string;
}

// Define term options for dropdown
const termOptions: Option[] = [
    { label: "First", value: "First" },
    { label: "Second", value: "Second" },
    { label: "Third", value: "Third" },
];

const EditGrading: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const [saving, setSaving] = useState(false);

    const gradingId = (params as any)?.id as string | undefined;

    // React Query hooks
    const { data: terms = [], isLoading: termsLoading, isError: termsError } = useGetTerms();
    const { data: policies = [], isLoading: policiesLoading, isError: policiesError } = useGetGradingPolicies();
    const {
        data: gradingData,
        isLoading: gradingLoading,
        isError: gradingError,
        error: gradingLoadError,
        refetch: refetchGrading,
    } = useGetGradingById(gradingId, { enabled: Boolean(gradingId) });

    const updateMutation = useUpdateGrading();
    const invalidateGradings = useInvalidateGradings();

    // derive session options from terms
    const [sessions, setSessions] = useState<Option[]>([]);
    useEffect(() => {
        const sessionSet = new Set<string>();
        if (Array.isArray(terms)) {
            terms.forEach((t: any) => {
                if (t?.session) sessionSet.add(t.session);
            });
        }
        setSessions(Array.from(sessionSet).map(s => ({ label: s, value: s })));
    }, [terms]);

    // derive grading policy options
    const [gradingPolicies, setGradingPolicies] = useState<Option[]>([]);
    useEffect(() => {
        if (Array.isArray(policies)) {
            setGradingPolicies(policies.map((p: any) => ({ label: p.title, value: p.id })));
        } else {
            setGradingPolicies([]);
        }
    }, [policies]);

    // react-hook-form setup
    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<GradingUpdateSchema>({
        resolver: zodResolver(gradingUpdateSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            session: "",
            term: undefined,
            published: false,
            gradingPolicyId: "",
        },
    });

    // populate form with gradingData when it arrives
    useEffect(() => {
        if (gradingData) {
            setValue("title", gradingData.title ?? "");
            setValue("session", gradingData.session ?? "");
            setValue("term", gradingData.term ?? undefined);
            setValue("published", gradingData.published ?? false);
            setValue("gradingPolicyId", gradingData.gradingPolicyId ?? "");
        }
    }, [gradingData, setValue]);

    // show loading errors
    useEffect(() => {
        if (gradingError) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (gradingLoadError as any)?.message || "Failed to load grading data.",
                life: 4000,
            });
        }
    }, [gradingError, gradingLoadError]);

    useEffect(() => {
        if (termsError) {
            toast.current?.show({ severity: "error", summary: "Load Error", detail: "Failed to load sessions (terms).", life: 3000 });
        }
    }, [termsError]);

    useEffect(() => {
        if (policiesError) {
            toast.current?.show({ severity: "error", summary: "Load Error", detail: "Failed to load grading policies.", life: 3000 });
        }
    }, [policiesError]);

    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const handleBack = () => {
        router.back();
    };

    const onSubmit = async (data: GradingUpdateSchema) => {
        setSaving(true);
        try {
            if (!gradingId) {
                show("error", "Invalid Grading", "Grading ID is missing.");
                setSaving(false);
                return;
            }

            // call optimistic update mutation
            await updateMutation.mutateAsync({ id: gradingId, data });

            show("success", "Grading Updated", "Grading session has been updated successfully.");
            invalidateGradings();
            setTimeout(() => router.back(), 600);
        } catch (err: any) {
            const msg = err?.message || "Failed to update grading session, please try again.";
            show("error", "Update Error", msg);
        } finally {
            setSaving(false);
        }
    };

    const loading = gradingLoading || termsLoading || policiesLoading;

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
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {saving && <Spinner visible onHide={() => setSaving(false)} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Grading Session</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>
            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    <div className="p-field">
                        <label htmlFor="title">Title</label>
                        <InputText id="title" {...register("title")} className={errors.title ? "p-invalid w-full" : "w-full"} />
                        {errors.title && <small className="p-error">{errors.title.message}</small>}
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="session">Session</label>
                            <Controller
                                name="session"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="session"
                                        {...field}
                                        options={sessions}
                                        placeholder="Select Session"
                                        className={errors.session ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.session && <small className="p-error">{errors.session.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="term">Term</label>
                            <Controller
                                name="term"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="term"
                                        {...field}
                                        options={termOptions}
                                        placeholder="Select Term"
                                        className={errors.term ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.term && <small className="p-error">{errors.term.message}</small>}
                        </div>
                    </div>

                    <div className="p-field">
                        <label htmlFor="gradingPolicyId">Grading Policy</label>
                        <Controller
                            name="gradingPolicyId"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="gradingPolicyId"
                                    {...field}
                                    options={gradingPolicies}
                                    placeholder="Select Grading Policy"
                                    className={errors.gradingPolicyId ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.gradingPolicyId && <small className="p-error">{errors.gradingPolicyId.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="published">Published</label>
                        <Controller
                            name="published"
                            control={control}
                            defaultValue={false}
                            render={({ field }) => (
                                <Checkbox id="published" inputId="published" onChange={(e) => field.onChange(e.checked)} checked={field.value ?? false} className="ml-2" />
                            )}
                        />
                        {errors.published && <small className="p-error">{errors.published.message}</small>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Update" type="submit" className="p-button-primary" loading={saving} disabled={saving} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditGrading;
