"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { parentSchema, ParentSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";
import Uploader from "@/components/Uploader/Uploader";

import { useCreateParent } from "@/hooks/useParents";

// Option interface
interface Option {
    label: string;
    value: string;
}

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

const genderOptions: Option[] = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

const NewParent: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast | null>(null);

    // react-query createParent mutation
    const createParentMutation = useCreateParent();
    const { mutate, isLoading: mutationLoading, isPending: mutationPending } = createParentMutation as any;

    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState<{ path: string; id: string; url?: string | null } | null>(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(parentSchema),
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
            password: "password",
            active: true,
        },
    });

    // helper to show toast
    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show?.({ severity, summary, detail, life: 3000 });
    };

    const handleBack = () => router.back();

    // Normalize birthday
    const normalizeBirthday = (value: unknown): Date | null | undefined => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (value instanceof Date) return value;
        if (typeof value === "string" && value.trim() !== "") {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    };

    // submit via react-query mutation
    const onSubmit = (data: ParentSchema) => {
        const normalizedBirthday = normalizeBirthday((data as any).birthday);

        const payload: Partial<ParentSchema & { avarta?: string | null }> = {
            ...data,
            birthday: normalizedBirthday as any,
            avarta: uploaded?.path ?? "",
            password: data.password || "password",
        };

        // trigger mutation
        mutate(payload, {
            onSuccess: () => {
                show("success", "Parent Created", "New parent has been created successfully.");
                reset();
                setTimeout(() => router.back(), 900);
            },
            onError: (err: any) => {
                show("error", "Creation Error", err?.message || "Failed to create parent. Please try again.");
            },
        });
    };

    // derived saving state from mutation
    const isSaving = Boolean(mutationLoading || mutationPending);

    // loading placeholder (no external fetches here; kept for parity)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    return (
        <section className="w-[96%] max-w-2xl bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {isSaving && <Spinner visible onHide={() => { /* noop */ }} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Parent</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 hidden sm:inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    <div className="p-field">
                        <Uploader
                            onUploadSuccess={(meta) => setUploaded(meta)}
                            chooseLabel="Drag & Drop or Click to Upload Profile Picture"
                            dropboxFolder="/habnajschools"
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="title">Title</label>
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Dropdown id="title" {...field} options={titleOptions} placeholder="Select Title" className={errors.title ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.title && <small className="p-error">{errors.title.message}</small>}
                    </div>

                    <div className="p-field grid grid-col-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstname">First Name</label>
                            <InputText id="firstname" {...register("firstname" as any)} className={errors.firstname ? "p-invalid w-full" : "w-full"} />
                            {errors.firstname && <small className="p-error">{errors.firstname.message}</small>}
                        </div>

                        <div>
                            <label htmlFor="othername">Other Name</label>
                            <InputText id="othername" {...register("othername" as any)} className={errors.othername ? "p-invalid w-full" : "w-full"} />
                            {errors.othername && <small className="p-error">{errors.othername.message}</small>}
                        </div>
                    </div>

                    <div className="p-field ">
                        <label htmlFor="surname">Surname</label>
                        <InputText id="surname" {...register("surname" as any)} className={errors.surname ? "p-invalid w-full" : "w-full"} />
                        {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="gender">Gender</label>
                        <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                                <Dropdown id="gender" {...field} options={genderOptions} placeholder="Select Gender" className={errors.gender ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.gender && <small className="p-error">{errors.gender.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="phone">Phone</label>
                        <InputText id="phone" {...register("phone" as any)} className={errors.phone ? "p-invalid w-full" : "w-full"} />
                        {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                    </div>

                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Save" type="submit" className="p-button-primary" loading={isSaving} disabled={isSaving} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default NewParent;
