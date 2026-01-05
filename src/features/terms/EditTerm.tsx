"use client";

import React, { useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";

import { termSchema, TermSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

import { useGetTermById, useUpdateTerm } from "@/hooks/useTerms";

const termOptions = [
    { label: "First", value: "First" },
    { label: "Second", value: "Second" },
    { label: "Third", value: "Third" },
];

const EditTerm: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const termId = params.id;
    const toast = useRef<Toast>(null);

    const { data: term, isPending: fetching } = useGetTermById(termId?.toLocaleString(), {
        enabled: Boolean(termId),
    });
    const updateTermMutation = useUpdateTerm();

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(termSchema),
        mode: "onBlur",
    });

    // Set form values when term data is loaded
    useEffect(() => {
        if (term) {
            setValue("session", term.session);
            setValue("term", term.term);
            setValue("start", term.start ? new Date(term.start) : "");
            setValue("end", term.end ? new Date(term.end) : "");
            setValue("nextterm", term.nextterm ? new Date(term.nextterm) : "");
        }
    }, [term, setValue]);

    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const handleBack = () => router.back();

    const onSubmit = async (data: TermSchema) => {
        if (!termId) return;

        const id = Array.isArray(termId) ? termId[0] : termId;
        if (!id) return;
        const preparedData = {
            ...data,
            start: data.start ? (typeof data.start === "string" ? new Date(data.start) : data.start) : undefined,
            end: data.end ? (typeof data.end === "string" ? new Date(data.end) : data.end) : undefined,
            nextterm: data.nextterm ? (typeof data.nextterm === "string" ? new Date(data.nextterm) : data.nextterm) : undefined,
        };

        try {
            await updateTermMutation.mutateAsync(
                { id, data: preparedData },
                {
                    onSuccess: () => {
                        show("success", "Term Updated", "Term has been updated successfully.");
                        setTimeout(() => router.back(), 1000);
                    },
                    onError: (err: any) => {
                        show(
                            "error",
                            "Update Error",
                            err?.message || "Failed to update term record, please try again."
                        );
                    },
                }
            );
        } catch (err: any) {
            show("error", "Update Error", err?.message || "Could not update term record.");
        }
    };

    const loading = updateTermMutation.isPending;

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
            {loading && <Spinner visible onHide={() => { }} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Term</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Session */}
                    <div className="p-field">
                        <label htmlFor="session">Session</label>
                        <InputText
                            id="session"
                            placeholder="Enter session"
                            {...register("session")}
                            className={errors.session ? "p-invalid" : ""}
                        />
                        {errors.session && <small className="p-error">{errors.session.message}</small>}
                    </div>

                    {/* Term */}
                    <div className="p-field">
                        <label>Term</label>
                        <Controller
                            name="term"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="term"
                                    {...field}
                                    options={termOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select a term"
                                    className={errors.term ? "p-invalid" : ""}
                                />
                            )}
                        />
                        {errors.term && <small className="p-error">{errors.term.message}</small>}
                    </div>

                    {/* Start Date */}
                    <div className="flex flex-col mb-1">
                        <label htmlFor="start" className="block text-gray-400 font-medium mb-2">
                            Start Date
                        </label>
                        <Controller
                            name="start"
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={typeof field.value === "string" ? (field.value ? new Date(field.value) : null) : field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    placeholder="Term start date"
                                />
                            )}
                        />
                        {errors.start && <p className="text-red-500 text-sm">{errors.start.message}</p>}
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col mb-1">
                        <label htmlFor="end" className="block text-gray-400 font-medium mb-2">
                            End Date
                        </label>
                        <Controller
                            name="end"
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={typeof field.value === "string" ? (field.value ? new Date(field.value) : null) : field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    placeholder="Term end date"
                                />
                            )}
                        />
                        {errors.end && <p className="text-red-500 text-sm">{errors.end.message}</p>}
                    </div>

                    {/* Next Term */}
                    <div className="flex flex-col mb-1">
                        <label htmlFor="nextterm" className="block text-gray-400 font-medium mb-2">
                            Next Term Begins
                        </label>
                        <Controller
                            name="nextterm"
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={typeof field.value === "string" ? (field.value ? new Date(field.value) : null) : field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    placeholder="Next term date"
                                />
                            )}
                        />
                        {errors.nextterm && <p className="text-red-500 text-sm">{errors.nextterm.message}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Update" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditTerm;
