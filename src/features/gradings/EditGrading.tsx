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
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<Option[]>([]);
    const [gradingPolicies, setGradingPolicies] = useState<Option[]>([]);
    const gradingId = params.id;

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

    // Fetch grading data, sessions (from terms), and grading policies on component mount
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const fetchData = async () => {
            if (mounted) setLoading(true);
            try {
                if (!gradingId) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Invalid Grading",
                        detail: "Grading ID is missing.",
                        life: 3000,
                    });
                    return;
                }

                // Fetch grading, terms, and grading policies concurrently
                const [gradingResponse, termsResponse, policiesResponse] = await Promise.all([
                    fetch(`/api/gradings/${gradingId}`, { signal: controller.signal }),
                    fetch("/api/terms", { signal: controller.signal }),
                    fetch("/api/policies", { signal: controller.signal }),
                ]);

                // Handle grading response
                if (!gradingResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load grading data.",
                        life: 3000,
                    });
                    return;
                }
                const gradingPayload = await gradingResponse.json();
                if (!gradingPayload) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Grading response format invalid.",
                        life: 3000,
                    });
                    return;
                }
                const gradingData = gradingPayload.data || gradingPayload;
                setValue("title", gradingData.title || "");
                setValue("session", gradingData.session || "");
                setValue("term", gradingData.term || undefined);
                setValue("published", gradingData.published || false);
                setValue("gradingPolicyId", gradingData.gradingPolicyId || "");

                // Handle terms response to derive sessions
                if (!termsResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load terms data.",
                        life: 3000,
                    });
                    return;
                }
                const termsData = await termsResponse.json();
                if (!Array.isArray(termsData.data)) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Unexpected response shape — expected array for terms.",
                        life: 3000,
                    });
                    return;
                }
                const sessionSet = new Set<string>(termsData.data.map((term: any) => term.session));
                const sessionOptions: Option[] = Array.from(sessionSet).map((session: string) => ({
                    label: session,
                    value: session,
                }));
                if (mounted) setSessions(sessionOptions);

                // Handle grading policies response
                if (!policiesResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load grading policies data.",
                        life: 3000,
                    });
                    return;
                }
                const policiesData = await policiesResponse.json();
                const policyOptions: Option[] = policiesData.data.map((policy: any) => ({
                    label: policy.title,
                    value: policy.id,
                }));
                if (mounted) setGradingPolicies(policyOptions);
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
                if (mounted) setLoading(false);
            }
        };

        if (gradingId) {
            fetchData();
        }

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [gradingId, setValue]);

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
    const onSubmit = async (data: GradingUpdateSchema) => {
        setSaving(true);
        try {
            if (!gradingId) {
                show("error", "Invalid Grading", "Grading ID is missing.");
                setSaving(false);
                return;
            }

            const payload = { ...data };
            const res = await fetch(`/api/gradings/${gradingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Grading Updated", "Grading session has been updated successfully.");
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                show("error", "Update Error", result.error || result.message || "Failed to update grading session, please try again.");
            }
        } catch (err: any) {
            show("error", "Update Error", err.message || "Could not update grading session.");
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
                        <InputText
                            id="title"
                            {...register("title")}
                            className={errors.title ? "p-invalid w-full" : "w-full"}
                        />
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
                            loading={saving}
                            disabled={saving}
                        />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditGrading;