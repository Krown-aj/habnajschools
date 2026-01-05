"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { teacherSchema, TeacherSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

import { useGetTeacherById, useUpdateTeacher } from "@/hooks/useTeachers";
import { Teacher as TeacherType } from "@/generated/prisma";

interface Option {
    label: string;
    value: string;
}

const titleOptions: Option[] = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Miss.", value: "Miss." },
    { label: "Dr.", value: "Dr." },
    { label: "Prof.", value: "Prof." },
    { label: "Engr.", value: "Engr." },
];

const sectionOptions: Option[] = [
    { label: "Pre-Nursery", value: "PRE-NURSERY" },
    { label: "Nursery", value: "NURSERY" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
];

const genderOptions: Option[] = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

const qualificationOptions: Option[] = [
    { label: "NCE", value: "NCE" },
    { label: "OND/ND", value: "OND/ND" },
    { label: "HND", value: "HND" },
    { label: "Bsc.", value: "Bsc." },
    { label: "Bed.", value: "Bed." },
    { label: "B Tech.", value: "B Tech." },
    { label: "Msc.", value: "Msc." },
    { label: "PhD.", value: "PhD." },
];

const bloodgroupOptions: Option[] = [
    { label: "A+", value: "A+" },
    { label: "A-", value: "A-" },
    { label: "B+", value: "B+" },
    { label: "B-", value: "B-" },
    { label: "AB+", value: "AB+" },
    { label: "AB-", value: "AB-" },
    { label: "O+", value: "O+" },
    { label: "O-", value: "O-" },
];

const EditTeacher: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast | null>(null);
    const teacherId = typeof params?.id === "string" ? params.id : undefined;

    const [states, setStates] = useState<Option[]>([]);
    const [lgas, setLgas] = useState<Option[]>([]);
    const [localLoading, setLocalLoading] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(teacherSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            firstname: "",
            surname: "",
            section: "",
            othername: "",
            birthday: undefined,
            gender: undefined,
            qualification: "",
            bloodgroup: "",
            email: "",
            phone: "",
            state: "",
            lga: "",
            address: "",
        },
    });

    const selectedState = watch("state");

    // react-query hooks for teacher
    const { data: teacherData, isLoading: isTeacherLoading, error: fetchError } = useGetTeacherById(
        teacherId,
        { enabled: !!teacherId, staleTime: 1000 * 60 * 5 }
    );

    const updateTeacherMutation = useUpdateTeacher();

    // show fetch error as toast
    useEffect(() => {
        if (fetchError) {
            toast.current?.show?.({
                severity: "error",
                summary: "Fetch Error",
                detail: fetchError.message || "Failed to load teacher data.",
                life: 4000,
            });
        }
    }, [fetchError]);

    // When teacherData arrives, populate form (normalize birthday)
    useEffect(() => {
        if (!teacherData) return;

        const normalized = {
            title: teacherData.title ?? "",
            firstname: teacherData.firstname ?? "",
            surname: teacherData.surname ?? "",
            section: teacherData.section ?? "",
            othername: teacherData.othername ?? "",
            birthday:
                teacherData.birthday === undefined || teacherData.birthday === null
                    ? undefined
                    : teacherData.birthday instanceof Date
                        ? teacherData.birthday
                        : new Date(teacherData.birthday),
            gender: teacherData.gender ?? undefined,
            qualification: teacherData.qualification ?? "",
            bloodgroup: teacherData.bloodgroup ?? "",
            email: teacherData.email ?? "",
            phone: teacherData.phone ?? "",
            state: teacherData.state ?? "",
            lga: teacherData.lga ?? "",
            address: teacherData.address ?? "",
        };

        // reset form with normalized values
        reset(normalized as Partial<TeacherSchema>);
    }, [teacherData, reset]);

    // Fetch Nigerian states (once)
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const fetchStates = async () => {
            if (mounted) setLocalLoading(true);
            try {
                const res = await fetch("https://nga-states-lga.onrender.com/fetch", { signal: controller.signal });
                if (!res.ok) throw new Error(`Failed to fetch states (status ${res.status})`);
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error("Unexpected states response shape");
                const opts = data.map((s: string) => ({ label: s, value: s }));
                if (mounted) setStates(opts);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Failed to load states", err);
                toast.current?.show?.({
                    severity: "error",
                    summary: "Error",
                    detail: "Could not load Nigerian states.",
                    life: 3000,
                });
            } finally {
                if (mounted) setLocalLoading(false);
            }
        };

        fetchStates();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, []);

    // Fetch LGAs whenever selectedState changes
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const fetchLgas = async () => {
            if (!selectedState) {
                if (mounted) setLgas([]);
                return;
            }
            if (mounted) setLocalLoading(true);
            try {
                const res = await fetch(
                    `https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedState)}`,
                    { signal: controller.signal }
                );
                if (!res.ok) throw new Error(`Failed to fetch LGAs (status ${res.status})`);
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error("Unexpected LGAs response shape");
                const opts = data.map((l: string) => ({ label: l, value: l }));
                if (mounted) setLgas(opts);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Failed to load LGAs", err);
                toast.current?.show?.({
                    severity: "error",
                    summary: "Error",
                    detail: "Could not load LGAs.",
                    life: 3000,
                });
                if (mounted) setLgas([]);
            } finally {
                if (mounted) setLocalLoading(false);
            }
        };

        fetchLgas();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [selectedState]);

    const show = useCallback((severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show?.({ severity, summary, detail, life: 3000 });
    }, []);

    const handleBack = useCallback(() => router.back(), [router]);

    // Normalize birthday and submit via mutation
    const onSubmit = async (data: TeacherSchema) => {
        if (!teacherId) {
            show("error", "Invalid Teacher", "Teacher ID is missing.");
            return;
        }

        // Normalize birthday to Date | null
        const normalizedBirthday: Date | null =
            data.birthday === undefined || data.birthday === null
                ? null
                : typeof data.birthday === "string"
                    ? new Date(data.birthday)
                    : data.birthday instanceof Date
                        ? data.birthday
                        : null;

        const payload: Partial<TeacherType & { password?: string }> = {
            ...data,
            birthday: normalizedBirthday,
        };

        setSaving(true);
        updateTeacherMutation.mutate(
            { id: teacherId, data: payload },
            {
                onSuccess: () => {
                    show("success", "Teacher Updated", "Teacher has been updated successfully.");
                    // give user a moment to read toast
                    setTimeout(() => router.back(), 900);
                },
                onError: (err: any) => {
                    show("error", "Update Error", err?.message || "Failed to update teacher record, please try again.");
                },
                onSettled: () => {
                    setSaving(false);
                },
            }
        );
    };

    // saving state based on local + mutation
    const [saving, setSaving] = useState(false);
    const isSaving = saving || (updateTeacherMutation as any).isLoading || (updateTeacherMutation as any).isPending;

    const isLoading = isTeacherLoading || localLoading;

    if (isLoading && !teacherData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    if (!teacherData && !isTeacherLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Teacher Not Found</h2>
                <p className="text-gray-600 mb-6">The requested teacher record could not be loaded.</p>
                <Button label="Go Back" icon="pi pi-arrow-left" onClick={handleBack} className="p-button-secondary" />
                <Toast ref={toast} />
            </div>
        );
    }

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {isSaving && <Spinner visible onHide={() => setSaving(false)} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Teacher</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={handleBack}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
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
                        <div>
                            <label htmlFor="qualification">Qualification</label>
                            <Controller
                                name="qualification"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown id="qualification" {...field} options={qualificationOptions} placeholder="Select Qualification" className={errors.qualification ? "p-invalid w-full" : "w-full"} />
                                )}
                            />
                            {errors.qualification && <small className="p-error">{errors.qualification.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstname">First Name</label>
                            <InputText id="firstname" {...register("firstname")} className={errors.firstname ? "p-invalid w-full" : "w-full"} />
                            {errors.firstname && <small className="p-error">{errors.firstname.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="othername">Other Name</label>
                            <InputText id="othername" {...register("othername")} className={errors.othername ? "p-invalid w-full" : "w-full"} />
                            {errors.othername && <small className="p-error">{errors.othername.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="surname">Surname</label>
                            <InputText id="surname" {...register("surname")} className={errors.surname ? "p-invalid w-full" : "w-full"} />
                            {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="section">Section</label>
                            <Controller
                                name="section"
                                control={control}
                                render={({ field }) => <Dropdown id="section" {...field} options={sectionOptions} placeholder="Select Section" className={errors.section ? "p-invalid w-full" : "w-full"} />}
                            />
                            {errors.section && <small className="p-error">{errors.section.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="birthday">Birthday</label>
                            <Controller
                                name="birthday"
                                control={control}
                                render={({ field }) => (
                                    <Calendar
                                        id="birthday"
                                        value={
                                            field.value instanceof Date || field.value === undefined || field.value === null
                                                ? (field.value as Date | null | undefined)
                                                : field.value
                                                    ? new Date(field.value as any)
                                                    : null
                                        }
                                        onChange={(e) => field.onChange(e.value)}
                                        onBlur={field.onBlur}
                                        dateFormat="dd/mm/yy"
                                        placeholder="Select Date"
                                        className={errors.birthday ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.birthday && <small className="p-error">{errors.birthday.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="gender">Gender</label>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => <Dropdown id="gender" {...field} options={genderOptions} placeholder="Select Gender" className={errors.gender ? "p-invalid w-full" : "w-full"} />}
                            />
                            {errors.gender && <small className="p-error">{errors.gender.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bloodgroup">Blood Group</label>
                            <Controller
                                name="bloodgroup"
                                control={control}
                                render={({ field }) => <Dropdown id="bloodgroup" {...field} options={bloodgroupOptions} placeholder="Select Blood Group" className={errors.bloodgroup ? "p-invalid w-full" : "w-full"} />}
                            />
                            {errors.bloodgroup && <small className="p-error">{errors.bloodgroup.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <InputText id="email" type="email" {...register("email")} className={errors.email ? "p-invalid w-full" : "w-full"} />
                            {errors.email && <small className="p-error">{errors.email.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone">Phone</label>
                            <InputText id="phone" {...register("phone")} className={errors.phone ? "p-invalid w-full" : "w-full"} />
                            {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="state">State</label>
                            <Controller
                                name="state"
                                control={control}
                                render={({ field }) => <Dropdown id="state" {...field} options={states} placeholder="Select State" className={errors.state ? "p-invalid w-full" : "w-full"} />}
                            />
                            {errors.state && <small className="p-error">{errors.state.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="lga">LGA</label>
                            <Controller
                                name="lga"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="lga"
                                        {...field}
                                        options={lgas}
                                        placeholder={selectedState ? "Select LGA" : "Select a state first"}
                                        className={errors.lga ? "p-invalid w-full" : "w-full"}
                                        disabled={!selectedState}
                                    />
                                )}
                            />
                            {errors.lga && <small className="p-error">{errors.lga.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="address">Address</label>
                            <InputTextarea rows={3} id="address" {...register("address")} className={errors.address ? "p-invalid w-full" : "w-full"} />
                            {errors.address && <small className="p-error">{errors.address.message}</small>}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Update" type="submit" className="p-button-primary" loading={Boolean(isSaving)} disabled={Boolean(isSaving)} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditTeacher;
