"use client";

import React, { useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";

import { gradingPolicyUpdateSchema, type GradingPolicyUpdateSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";
import { useGetGradingPolicyById, useUpdateGradingPolicy, useInvalidateGradingPolicies } from "@/hooks/useGradingPolicies";

const TRAIT_CATEGORIES = [
    { label: "Behavioural", value: "BEHAVIOURAL" },
    { label: "Affective", value: "AFFECTIVE" },
    { label: "Psychomotor", value: "PSYCHOMOTOR" },
    { label: "Cognitive", value: "COGNITIVE" },
];

const EditGradingPolicy: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);

    const policyId = typeof params?.id === "string" ? params.id : undefined;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<GradingPolicyUpdateSchema>({
        resolver: zodResolver(gradingPolicyUpdateSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            description: "",
            passMark: undefined,
            maxScore: undefined,
            assessments: [],
            deleteAssessments: [],
            traits: [],
            deleteTraits: [],
        },
    });

    const {
        fields: assessmentFields,
        append: appendAssessment,
        remove: removeAssessment,
        update: updateAssessment,
    } = useFieldArray({ control, name: "assessments" });

    const {
        fields: traitFields,
        append: appendTrait,
        remove: removeTrait,
        update: updateTrait,
    } = useFieldArray({ control, name: "traits" });

    // React Query hooks
    const { data: policyData, isLoading: queryLoading, error: queryError } = useGetGradingPolicyById(
        policyId,
        { enabled: Boolean(policyId) }
    );
    const updateMutation = useUpdateGradingPolicy();
    const invalidate = useInvalidateGradingPolicies();

    // Map query errors to toast
    useEffect(() => {
        if (queryError) {
            const message = (queryError as any)?.message || "Failed to load grading policy.";
            toast.current?.show({ severity: "error", summary: "Fetching Error", detail: message, life: 4000 });
        }
    }, [queryError]);

    // Populate form when policyData arrives
    useEffect(() => {
        if (!policyData) return;

        setValue("title", policyData.title ?? "");
        setValue("description", policyData.description ?? "");
        setValue("passMark", policyData.passMark ?? undefined);
        setValue("maxScore", policyData.maxScore ?? undefined);

        setValue(
            "assessments",
            (policyData.assessments || []).map((a: any) => ({
                id: a.id,
                name: a.name,
                weight: a.weight,
                maxScore: a.maxScore,
            }))
        );

        setValue(
            "traits",
            (policyData.traits || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                category: t.category ?? "",
            }))
        );

        // ensure delete arrays are empty initially
        setValue("deleteAssessments", []);
        setValue("deleteTraits", []);
    }, [policyData, setValue]);

    // show helper
    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const handleBack = () => router.back();

    // Submit handler
    const onSubmit = async (data: GradingPolicyUpdateSchema) => {
        if (!policyId) {
            show("error", "Invalid Policy", "Grading Policy ID is missing.");
            return;
        }

        try {
            await updateMutation.mutateAsync({ id: policyId, data });
            show("success", "Grading Policy Updated", "Grading policy has been updated successfully.");
            invalidate();
            router.back();
        } catch (err: any) {
            const message = (err && (err.message || (err as any).response?.data?.message)) || "Failed to update grading policy.";
            show("error", "Update Error", message);
        }
    };

    const saving = updateMutation.isPending;
    const loading = queryLoading;

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
            {saving && <Spinner visible onHide={() => { }} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Grading Policy</h2>
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

                    <div className="p-field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            rows={3}
                            {...register("description")}
                            className={errors.description ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.description && <small className="p-error">{errors.description.message}</small>}
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="passMark">Pass Mark</label>
                            <Controller
                                name="passMark"
                                control={control}
                                render={({ field }) => (
                                    <InputNumber
                                        id="passMark"
                                        value={field.value}
                                        onValueChange={(e) => field.onChange(e.value)}
                                        onBlur={field.onBlur}
                                        min={0}
                                        className={errors.passMark ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.passMark && <small className="p-error">{errors.passMark.message}</small>}
                        </div>

                        <div>
                            <label htmlFor="maxScore">Max Score</label>
                            <Controller
                                name="maxScore"
                                control={control}
                                render={({ field }) => (
                                    <InputNumber
                                        id="maxScore"
                                        value={field.value}
                                        onValueChange={(e) => field.onChange(e.value)}
                                        onBlur={field.onBlur}
                                        min={1}
                                        className={errors.maxScore ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.maxScore && <small className="p-error">{errors.maxScore.message}</small>}
                        </div>
                    </div>

                    {/* Assessments */}
                    <div className="p-field">
                        <label className="font-bold">Assessments</label>
                        {assessmentFields.map((field, index) => (
                            <div key={field.id} className="border border-gray-300 rounded-md p-4 mb-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor={`assessments.${index}.name`}>Assessment Name</label>
                                        <InputText
                                            id={`assessments.${index}.name`}
                                            {...register(`assessments.${index}.name` as const)}
                                            className={errors.assessments?.[index]?.name ? "p-invalid w-full" : "w-full"}
                                        />
                                        {errors.assessments?.[index]?.name && (
                                            <small className="p-error">{(errors.assessments[index] as any).name?.message}</small>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor={`assessments.${index}.weight`}>Weight (%)</label>
                                        <Controller
                                            name={`assessments.${index}.weight` as const}
                                            control={control}
                                            render={({ field }) => (
                                                <InputNumber
                                                    id={`assessments.${index}.weight`}
                                                    value={field.value}
                                                    onValueChange={(e) => field.onChange(e.value)}
                                                    onBlur={field.onBlur}
                                                    min={0}
                                                    className={errors.assessments?.[index]?.weight ? "p-invalid w-full" : "w-full"}
                                                />
                                            )}
                                        />
                                        {errors.assessments?.[index]?.weight && (
                                            <small className="p-error">{(errors.assessments[index] as any).weight?.message}</small>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor={`assessments.${index}.maxScore`}>Max Score</label>
                                        <Controller
                                            name={`assessments.${index}.maxScore` as const}
                                            control={control}
                                            render={({ field }) => (
                                                <InputNumber
                                                    id={`assessments.${index}.maxScore`}
                                                    value={field.value}
                                                    onValueChange={(e) => field.onChange(e.value)}
                                                    onBlur={field.onBlur}
                                                    min={1}
                                                    className={errors.assessments?.[index]?.maxScore ? "p-invalid w-full" : "w-full"}
                                                />
                                            )}
                                        />
                                        {errors.assessments?.[index]?.maxScore && (
                                            <small className="p-error">{(errors.assessments[index] as any).maxScore?.message}</small>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    label="Remove"
                                    type="button"
                                    className="p-button-danger p-button-sm mt-2"
                                    onClick={() => {
                                        const currentDelete = watch("deleteAssessments") || [];
                                        const id = (field as any).id;
                                        if (id) {
                                            setValue("deleteAssessments", [...currentDelete, id]);
                                        }
                                        removeAssessment(index);
                                    }}
                                    disabled={assessmentFields.length === 1}
                                />
                            </div>
                        ))}

                        <Button
                            label="Add Assessment"
                            type="button"
                            className="p-button-secondary p-button-sm"
                            onClick={() => appendAssessment({ name: "", weight: 0, maxScore: 100 })}
                        />
                    </div>

                    {/* Traits */}
                    <div className="p-field">
                        <label className="font-bold">Traits</label>
                        {traitFields.map((field, index) => (
                            <div key={field.id} className="border border-gray-300 rounded-md p-4 mb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor={`traits.${index}.name`}>Trait Name</label>
                                        <InputText
                                            id={`traits.${index}.name`}
                                            {...register(`traits.${index}.name` as const)}
                                            className={errors.traits?.[index]?.name ? "p-invalid w-full" : "w-full"}
                                        />
                                        {errors.traits?.[index]?.name && (
                                            <small className="p-error">{(errors.traits[index] as any).name?.message}</small>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor={`traits.${index}.category`}>Category</label>
                                        <Controller
                                            name={`traits.${index}.category` as const}
                                            control={control}
                                            render={({ field }) => (
                                                <Dropdown
                                                    id={`traits.${index}.category`}
                                                    value={field.value}
                                                    options={TRAIT_CATEGORIES}
                                                    onChange={(e) => field.onChange(e.value)}
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    placeholder="Select category"
                                                    className={errors.traits?.[index]?.category ? "p-invalid w-full" : "w-full"}
                                                />
                                            )}
                                        />
                                        {errors.traits?.[index]?.category && (
                                            <small className="p-error">{(errors.traits[index] as any).category?.message}</small>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    label="Remove"
                                    type="button"
                                    className="p-button-danger p-button-sm mt-2"
                                    onClick={() => {
                                        const currentDelete = watch("deleteTraits") || [];
                                        const id = (field as any).id;
                                        if (id) {
                                            setValue("deleteTraits", [...currentDelete, id]);
                                        }
                                        removeTrait(index);
                                    }}
                                    disabled={traitFields.length === 1}
                                />
                            </div>
                        ))}

                        <Button
                            label="Add Trait"
                            type="button"
                            className="p-button-secondary p-button-sm"
                            onClick={() => appendTrait({ name: "", category: "AFFECTIVE" })}
                        />
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

export default EditGradingPolicy;
