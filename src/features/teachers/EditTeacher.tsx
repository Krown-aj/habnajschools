"use client";

import React, { useRef, useState, useEffect } from "react";
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

// Define option interface
interface Option {
    label: string;
    value: string;
}

// Define title options for dropdown
const titleOptions = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Miss.", value: "Miss." },
    { label: "Dr.", value: "Dr." },
    { label: "Prof.", value: "Prof." },
    { label: "Engr.", value: "Engr." },
];

// Define gender options for dropdown
const genderOptions = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

// Define qualification options for dropdown
const qualificationOptions = [
    { label: "NCE", value: "NCE" },
    { label: "OND/ND", value: "OND/ND" },
    { label: "HND", value: "HND" },
    { label: "Bsc.", value: "Bsc." },
    { label: "Bed.", value: "Bed." },
    { label: "B Tech.", value: "B Tech." },
    { label: "Msc.", value: "Msc." },
    { label: "PhD.", value: "PhD." },
];

// Define blood group options for dropdown
const bloodgroupOptions = [
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
    const toast = useRef<Toast>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [states, setStates] = useState<Option[]>([]);
    const [lgas, setLgas] = useState<Option[]>([]);
    const teacherId = params.id;

    const {
        register,
        control,
        handleSubmit,
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

    // Watch state changes
    const selectedState = watch("state");

    // Fetch teacher data and states on component mount
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const fetchData = async () => {
            if (mounted) setLoading(true);
            try {
                if (!teacherId) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Invalid Teacher",
                        detail: "Teacher ID is missing.",
                        life: 3000,
                    });
                    return;
                }

                // Fetch teacher and states concurrently
                const [teacherResponse, statesResponse] = await Promise.all([
                    fetch(`/api/teachers/${teacherId}`, { signal: controller.signal }),
                    fetch("https://nga-states-lga.onrender.com/fetch", { signal: controller.signal }),
                ]);

                // Handle teacher response
                if (!teacherResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load teacher data.",
                        life: 3000,
                    });
                    return;
                }
                const teacherPayload = await teacherResponse.json();
                if (!teacherPayload) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Teacher response format invalid.",
                        life: 3000,
                    });
                    return;
                }
                const teacherData = teacherPayload.data || teacherPayload;
                setValue("title", teacherData.title || "");
                setValue("firstname", teacherData.firstname || "");
                setValue("surname", teacherData.surname || "");
                setValue("othername", teacherData.othername || "");
                setValue("birthday", teacherData.birthday ? new Date(teacherData.birthday) : undefined);
                setValue("gender", teacherData.gender || undefined);
                setValue("qualification", teacherData.qualification || undefined);
                setValue("bloodgroup", teacherData.bloodgroup || "");
                setValue("email", teacherData.email || "");
                setValue("phone", teacherData.phone || "");
                setValue("state", teacherData.state || "");
                setValue("lga", teacherData.lga || "");
                setValue("address", teacherData.address || "");

                // Handle states response
                if (!statesResponse.ok) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Fetching Error",
                        detail: "Failed to load Nigerian states.",
                        life: 3000,
                    });
                    return;
                }
                const statesData = await statesResponse.json();
                if (!Array.isArray(statesData)) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Parsing Error",
                        detail: "Unexpected response shape — expected array.",
                        life: 3000,
                    });
                    return;
                }
                const stateOptions: Option[] = statesData.map((state: string) => ({ label: state, value: state }));
                if (mounted) setStates(stateOptions);
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

        if (teacherId) {
            fetchData();
        }

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [teacherId, setValue]);

    // Fetch LGAs based on selected state
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        const fetchLgas = async () => {
            if (mounted) setLoading(true);
            try {
                const res = await fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedState)}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error(`Failed to fetch LGAs (status ${res.status})`);
                const data = await res.json();

                if (!Array.isArray(data)) throw new Error("Unexpected response shape — expected array");

                const opts: Option[] = data.map((lga: string) => ({ label: lga, value: lga }));

                if (mounted) setLgas(opts);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Unexpected fetch error:", err);
                toast?.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Could not load LGAs.",
                    life: 3000,
                });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (selectedState) fetchLgas();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [selectedState]);

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
    const onSubmit = async (data: TeacherSchema) => {
        setSaving(true);
        try {
            if (!teacherId) {
                show("error", "Invalid Teacher", "Teacher ID is missing.");
                setSaving(false);
                return;
            }

            const payload = { ...data };
            const res = await fetch(`/api/teachers/${teacherId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Teacher Updated", "Teacher has been updated successfully.");
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                show("error", "Update Error", result.error || result.message || "Failed to update teacher record, please try again.");
            }
        } catch (err: any) {
            show("error", "Update Error", err.message || "Could not update teacher record.");
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
                    {/* Title and qualification field */}
                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
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
                        <div>
                            <label htmlFor="qualification">Qualification</label>
                            <Controller
                                name="qualification"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="qualification"
                                        {...field}
                                        options={qualificationOptions}
                                        placeholder="Select Qualification"
                                        className={errors.qualification ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.qualification && <small className="p-error">{errors.qualification.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
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

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="birthday">Birthday</label>
                            <Controller
                                name="birthday"
                                control={control}
                                render={({ field }) => (
                                    <Calendar
                                        id="birthday"
                                        value={field.value instanceof Date || field.value === undefined ? field.value : field.value ? new Date(field.value) : null}
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
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bloodgroup">Blood Group</label>
                            <Controller
                                name="bloodgroup"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="bloodgroup"
                                        {...field}
                                        options={bloodgroupOptions}
                                        placeholder="Select Blood Group"
                                        className={errors.bloodgroup ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.bloodgroup && <small className="p-error">{errors.bloodgroup.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <InputText
                                id="email"
                                type="email"
                                {...register("email")}
                                className={errors.email ? "p-invalid w-full" : "w-full"}
                            />
                            {errors.email && <small className="p-error">{errors.email.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone">Phone</label>
                            <InputText
                                id="phone"
                                {...register("phone")}
                                className={errors.phone ? "p-invalid w-full" : "w-full"}
                            />
                            {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="state">State</label>
                            <Controller
                                name="state"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="state"
                                        {...field}
                                        options={states}
                                        placeholder="Select State"
                                        className={errors.state ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
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
                            <InputTextarea
                                rows={3}
                                id="address"
                                {...register("address")}
                                className={errors.address ? "p-invalid w-full" : "w-full"}
                            />
                            {errors.address && <small className="p-error">{errors.address.message}</small>}
                        </div>
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

export default EditTeacher;