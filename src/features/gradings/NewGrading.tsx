"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { gradingSchema, GradingSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

import { useGetTerms } from "@/hooks/useTerms";
import { useGetGradingPolicies } from "@/hooks/useGradingPolicies";
import { useCreateGrading, useInvalidateGradings } from "@/hooks/useGradings";

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

const NewGrading: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [saving, setSaving] = useState(false);

    // React Query hooks
    const { data: terms = [], isLoading: termsLoading, isError: termsError } = useGetTerms();
    const { data: policies = [], isLoading: policiesLoading, isError: policiesError } = useGetGradingPolicies();
    const createMutation = useCreateGrading();
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

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(gradingSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            session: "",
            term: undefined,
            published: false,
            gradingPolicyId: "",
        },
    });

    // combined loading
    const loading = termsLoading || policiesLoading;

    // show helper
    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const handleBack = () => {
        router.back();
    };

    const onSubmit = async (data: GradingSchema) => {
        setSaving(true);
        try {
            const created = await createMutation.mutateAsync(data);
            show("success", "Grading Created", "New grading session has been created successfully.");
            invalidateGradings();
            reset();
            router.back();
        } catch (err: any) {
            const msg = err?.message || (err?.response?.data?.error) || "Failed to create new grading session, please try again.";
            show("error", "Creation Error", msg);
        } finally {
            setSaving(false);
        }
    };

    // show toast if initial fetch errors
    useEffect(() => {
        if (termsError) {
            show("error", "Load Error", "Failed to load sessions (terms).");
        }
    }, [termsError]);

    useEffect(() => {
        if (policiesError) {
            show("error", "Load Error", "Failed to load grading policies.");
        }
    }, [policiesError]);

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
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Grading Template</h2>
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
                                <Checkbox
                                    id="published"
                                    inputId="published"
                                    onChange={(e) => field.onChange(e.checked)}
                                    checked={field.value ?? false}
                                    className="ml-2"
                                />
                            )}
                        />
                        {errors.published && <small className="p-error">{errors.published.message}</small>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Save" type="submit" className="p-button-primary" loading={saving} disabled={saving} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default NewGrading;
