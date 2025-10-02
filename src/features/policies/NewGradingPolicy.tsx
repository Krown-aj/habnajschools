"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";

import { gradingPolicySchema, GradingPolicySchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

const TRAIT_CATEGORIES = [
    { label: "Behavioural", value: "BEHAVIOURAL" },
    { label: "Affective", value: "AFFECTIVE" },
    { label: "Psychomotor", value: "PSYCHOMOTOR" },
    { label: "Cognitive", value: "COGNITIVE" },
];

const NewGradingPolicy: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [saving, setSaving] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<GradingPolicySchema>({
        resolver: zodResolver(gradingPolicySchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            description: "",
            passMark: 0,
            maxScore: 100,
            assessments: [{ name: "", weight: 0, maxScore: 100 }],
            traits: [{ name: "", category: undefined }],
        },
    });

    const {
        fields: assessmentFields,
        append: appendAssessment,
        remove: removeAssessment,
    } = useFieldArray({
        control,
        name: "assessments",
    });

    const {
        fields: traitFields,
        append: appendTrait,
        remove: removeTrait,
    } = useFieldArray({
        control,
        name: "traits",
    });

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

    // A function to submit data to API for saving
    const onSubmit = async (data: GradingPolicySchema) => {
        setSaving(true);
        try {
            const res = await fetch("/api/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Grading Policy Created", "New grading policy has been created successfully.");
                setTimeout(() => {
                    reset();
                    router.back();
                }, 1500);
            } else {
                show(
                    "error",
                    "Creation Error",
                    result.error || result.message || "Failed to create new grading policy, please try again."
                );
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create new grading policy.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {saving && <Spinner visible onHide={() => setSaving(false)} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Grading Policy</h2>
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
                                    onClick={() => removeAssessment(index)}
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

                    {/* Traits (category is now a Dropdown) */}
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
                                    onClick={() => removeTrait(index)}
                                    disabled={traitFields.length === 1}
                                />
                            </div>
                        ))}
                        <Button
                            label="Add Trait"
                            type="button"
                            className="p-button-secondary p-button-sm"
                            onClick={() => appendTrait({ name: "", category: 'AFFECTIVE' })}
                        />
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

export default NewGradingPolicy;
