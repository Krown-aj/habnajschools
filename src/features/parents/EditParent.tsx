"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { parentUpdateSchema, ParentSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";
import { useGetParentById, useUpdateParent } from "@/hooks/useParents";
import { Parent as ParentType } from "@/generated/prisma";

// Define option interface
interface Option {
    label: string;
    value: string;
}

// Define title options for dropdown
const titleOptions: Option[] = [
    { label: "Alh.", value: "Alh." },
    { label: "Bar.", value: "Bar." },
    { label: "Dr.", value: "Dr." },
    { label: "Engr.", value: "Engr." },
    { label: "Haj.", value: "Haj." },
    { label: "Mal.", value: "Mal." },
    { label: "Miss.", value: "Miss." },
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Past.", value: "Past." },
    { label: "Prof.", value: "Prof." },
];

// Define gender options for dropdown
const genderOptions: Option[] = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

const EditParent: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const [saving, setSaving] = useState(false);
    const parentId = typeof params?.id === "string" ? params.id : undefined;

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(parentUpdateSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            firstname: "",
            surname: "",
            othername: "",
            birthday: undefined,
            gender: undefined,
            bloodgroup: "",
            occupation: "",
            religion: "",
            phone: "",
            state: "",
            lga: "",
            address: "",
            active: true,
        },
    });

    // React Query: fetch parent
    const { data: parentData, isLoading: isParentLoading, error: fetchError } = useGetParentById(parentId, {
        enabled: !!parentId,
        staleTime: 1000 * 60 * 5,
    });

    const updateParentMutation = useUpdateParent();

    // Show fetch error as toast
    useEffect(() => {
        if (fetchError) {
            toast.current?.show?.({
                severity: "error",
                summary: "Fetch Error",
                detail: fetchError.message || "Failed to load parent data.",
                life: 4000,
            });
        }
    }, [fetchError]);

    // Populate form when parentData arrives
    useEffect(() => {
        if (!parentData) return;

        reset({
            title: parentData.title ?? "",
            firstname: parentData.firstname ?? "",
            surname: parentData.surname ?? "",
            othername: parentData.othername ?? "",
            gender: parentData.gender ?? undefined,
            phone: parentData.phone ?? "",
            active: parentData.active,
        });
    }, [parentData, reset]);

    const show = useCallback((severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show?.({ severity, summary, detail, life: 3000 });
    }, []);

    const handleBack = useCallback(() => router.back(), [router]);

    const onSubmit = async (data: Partial<ParentSchema>) => {
        if (!parentId) {
            show("error", "Invalid Parent", "Parent ID is missing.");
            return;
        }

        const payload: Partial<ParentType> = {
            ...data,
            birthday: data.birthday ? new Date(data.birthday) : undefined,
        };

        setSaving(true);
        updateParentMutation.mutate(
            { id: parentId, data: payload },
            {
                onSuccess: () => {
                    show("success", "Parent Updated", "Parent has been updated successfully.");
                    setTimeout(() => router.back(), 900);
                },
                onError: (err: any) => {
                    show("error", "Update Error", err?.message || "Failed to update parent record, please try again.");
                },
                onSettled: () => setSaving(false),
            }
        );
    };

    const isLoading = isParentLoading || saving;

    if (isLoading && !parentData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            </div>
        );
    }

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {saving && <Spinner visible onHide={() => setSaving(false)} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Parent</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 hidden sm:inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Title field */}
                    <div className="p-field">
                        <label htmlFor="title">Title</label>
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="title"
                                    {...field}
                                    options={titleOptions}
                                    placeholder="Select Title"
                                    className={errors.title ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.title && <small className="p-error">{errors.title.message}</small>}
                    </div>

                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstname">First Name</label>
                            <InputText
                                id="firstname"
                                {...register("firstname")}
                                className={errors.firstname ? "p-invalid w-full" : "w-full"}
                            />
                            {errors.firstname && <small className="p-error">{errors.firstname.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="othername">Other Name</label>
                            <InputText
                                id="othername"
                                {...register("othername")}
                                className={errors.othername ? "p-invalid w-full" : "w-full"}
                            />
                            {errors.othername && <small className="p-error">{errors.othername.message}</small>}
                        </div>
                    </div>

                    <div className="p-field">
                        <label htmlFor="surname">Surname</label>
                        <InputText
                            id="surname"
                            {...register("surname")}
                            className={errors.surname ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="gender">Gender</label>
                        <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="gender"
                                    {...field}
                                    options={genderOptions}
                                    placeholder="Select Gender"
                                    className={errors.gender ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.gender && <small className="p-error">{errors.gender.message}</small>}
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

export default EditParent;
