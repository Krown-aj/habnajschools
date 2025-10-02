"use client";

import React, { useRef, useState, useEffect } from "react";
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
import { set } from "zod";

// Define term options for dropdown
const termOptions = [
    { label: 'First', value: 'First' },
    { label: 'Second', value: 'Second' },
    { label: 'Third', value: 'Third' }
];

const EditTerm: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const termId = params.id;

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

    // Fetch term data when component mounts
    useEffect(() => {
        const fetchTermData = async () => {
            setFetching(true);
            try {
                const res = await fetch(`/api/terms/${termId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const result = await res.json();
                if (res.ok) {
                    // Set form values with fetched data
                    setValue("session", result.session);
                    setValue("term", result.term);
                    setValue("start", result.start ? new Date(result.start) : "");
                    setValue("end", result.end ? new Date(result.end) : "");
                    setValue("nextterm", result.nextterm ? new Date(result.nextterm) : "");
                } else {
                    show("error", "Fetch Error", result.error || "Failed to fetch term data.");
                }
            } catch (err: any) {
                show("error", "Fetch Error", err.message || "Could not fetch term data.");
            } finally {
                setFetching(false);
            }
        };

        if (termId) {
            fetchTermData();
        }
    }, [termId, setValue]);

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

    // A function to submit updated data to API
    const onSubmit = async (data: TermSchema) => {
        setLoading(true);
        try {
            // Calculate days open if not provided
            const startDate = new Date(data.start);
            const endDate = new Date(data.end);
            const opendays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const res = await fetch(`/api/terms/${termId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, daysopen: opendays }),
            });
            const result = await res.json();
            setLoading(false);
            if (res.ok) {
                show("success", "Term Updated", "Term has been updated successfully.");
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                show("error", "Update Error", result.error || result.message || "Failed to update term record, please try again.");
            }
        } catch (err: any) {
            show("error", "Update Error", err.message || "Could not update term record.");
        } finally {
            setLoading(false);
        }
    };

    // Loading effect 
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
                    {/* Session Field */}
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

                    {/* Term Field */}
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
                        {errors.term && (
                            <small className="p-error">{errors.term.message}</small>
                        )}
                    </div>

                    {/* Start Date Field */}
                    <div className='flex flex-col mb-1'>
                        <label htmlFor='start' className='block text-gray-400 font-medium mb-2'>
                            Start Date
                        </label>
                        <Controller
                            name='start'
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={typeof field.value === "string" ? (field.value ? new Date(field.value) : null) : field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat='dd/mm/yy'
                                    showIcon
                                    placeholder='Term start date'
                                />
                            )}
                        />
                        {errors.start && (
                            <p className='text-red-500 text-sm'>{errors.start.message}</p>
                        )}
                    </div>

                    {/* End Date Field */}
                    <div className='flex flex-col mb-1'>
                        <label htmlFor='end' className='block text-gray-400 font-medium mb-2'>
                            End Date
                        </label>
                        <Controller
                            name='end'
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={typeof field.value === "string" ? (field.value ? new Date(field.value) : null) : field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat='dd/mm/yy'
                                    showIcon
                                    placeholder='Term end date'
                                />
                            )}
                        />
                        {errors.end && (
                            <p className='text-red-500 text-sm'>{errors.end.message}</p>
                        )}
                    </div>

                    {/* Beginning of next term */}
                    <div className='flex flex-col mb-1'>
                        <label htmlFor='nextterm' className='block text-gray-400 font-medium mb-2'>
                            Next Term Begins
                        </label>
                        <Controller
                            name='nextterm'
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={typeof field.value === "string" ? (field.value ? new Date(field.value) : null) : field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat='dd/mm/yy'
                                    showIcon
                                    placeholder='Next term date'
                                />
                            )}
                        />
                        {errors.nextterm && (
                            <p className='text-red-500 text-sm'>{errors.nextterm.message}</p>
                        )}
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

export default EditTerm;