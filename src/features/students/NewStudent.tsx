"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";

import { studentAdmissionSchema, type StudentAdmissionSchema } from "@/lib/schemas/index";
import type { StudentAdmissionResult } from "@/lib/api/students";
import Spinner from "@/components/Spinner/Spinner";
import Uploader from "@/components/Uploader/Uploader";
import { useGetClasses } from "@/hooks/useClasses";
import { useGetParents } from "@/hooks/useParents";
import { useCreateStudent } from "@/hooks/useStudents";

// Define option interface
interface Option {
    label: string;
    value: string;
}

// Define gender options for dropdown
const genderOptions = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

// Define section options for dropdown
const sectionOptions = [
    { label: "Pre-Nursery", value: "PRE-NURSERY" },
    { label: "Nursery", value: "NURSERY" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
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

// Define house options for dropdown
const houseOptions = [
    { label: "Blue House", value: "Blue House" },
    { label: "Green House", value: "Green House" },
    { label: "Yellow House", value: "Yellow House" },
    { label: "Pink House", value: "Pink House" },
    { label: "Red House", value: "Red House" },
    { label: "White House", value: "White House" },
];

// Define religion options for dropdown
const religionOptions = [
    { label: "Christianity", value: "CHRISTIANITY" },
    { label: "Islam", value: "ISLAM" },
    { label: "Others", value: "OTHER" },
];

const NewStudent: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [uploaded, setUploaded] = useState<{ path: string; id: string; url?: string | null } | null>(null);
    const [pendingAdmission, setPendingAdmission] = useState<StudentAdmissionSchema | null>(null);
    const [createdAdmission, setCreatedAdmission] = useState<StudentAdmissionResult | null>(null);

    // Fetch all parents
    const { data: parentData, isLoading: isLoadingParents, isError: isErrorParents } = useGetParents();
    // Fetch all classes
    const { data: classData, isLoading: isLoadingClasses, isError: isErrorClasses } = useGetClasses();
    // Mutation hook for creating a student
    const createStudentMutation = useCreateStudent();

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(studentAdmissionSchema),
        mode: "onBlur",
        defaultValues: {
            guardianMode: "existing" as const,
            firstname: "",
            surname: "",
            othername: "",
            birthday: undefined,
            gender: undefined,
            religion: "",
            house: "",
            bloodgroup: "",
            address: "",
            state: "",
            lga: "",
            password: "",
            avarta: "",
            parentid: "",
            classid: "",
        },
    });
    const guardianMode = watch("guardianMode");
    const selectedClassId = watch("classid");
    const selectedClassData = classData?.find((schoolClass) => schoolClass.id === selectedClassId);

    // Transform parent data for the dropdown options, memoized for performance
    const parentOptions: Option[] = useMemo(() => {
        if (!parentData || !Array.isArray(parentData)) return [];
        return parentData.map((parent) => ({
            label: `${parent.title ? parent.title + " " : ""}${parent.firstname} ${parent.surname} ${parent.othername ? parent.othername : ""}`.trim(),
            value: parent.id,
        }));
    }, [parentData]);

    // Transform class data for the dropdown options, memoized for performance
    const classOptions: Option[] = useMemo(() => {
        if (!classData || !Array.isArray(classData)) return [];
        return classData.map((cls) => ({
            label: cls.name,
            value: cls.id,
        }));
    }, [classData]);

    // Log any data fetching errors
    useEffect(() => {
        if (isErrorParents || isErrorClasses) {
            console.error("Data fetching error for parents or classes");
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Could not fetch parents or classes data.",
                life: 3000,
            });
        }
    }, [isErrorParents, isErrorClasses]);

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

    const onSubmit = (data: StudentAdmissionSchema) => {
        setPendingAdmission(data);
    };

    const confirmAdmission = async () => {
        if (!pendingAdmission) return;
        const data = pendingAdmission;
        const normalizedBirthday: Date = typeof data.birthday === "string"
            ? new Date(data.birthday)
            : data.birthday;

        const payload = {
            ...data,
            birthday: normalizedBirthday,
            admissiondate: new Date(),
            avarta: uploaded ? uploaded.path : "",
        };

        try {
            const created = await createStudentMutation.mutateAsync(payload);
            setPendingAdmission(null);
            setCreatedAdmission(created);
            reset();
        } catch (err: any) {
            console.error("Mutation Error:", err);
            show("error", "Creation Error", err.message || "Failed to create new student record, please try again.");
        }
    };

    const selectedParent = pendingAdmission?.guardianMode === "existing"
        ? parentData?.find((parent) => parent.id === pendingAdmission.parentid)
        : null;
    const reviewGuardianName = pendingAdmission?.guardianMode === "new"
        ? `${pendingAdmission.newGuardian.firstname} ${pendingAdmission.newGuardian.surname}`.trim()
        : selectedParent
            ? `${selectedParent.firstname} ${selectedParent.surname}`.trim()
            : "Selected guardian";
    const reviewClassName = classData?.find((schoolClass) => schoolClass.id === pendingAdmission?.classid)?.name ?? "Selected class";

    const loading = isLoadingParents || isLoadingClasses;
    const saving = createStudentMutation.isPending;

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
        <section className="w-[96%] max-w-2xl bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {saving && <Spinner visible onHide={() => createStudentMutation.reset()} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Create New Student</h2>
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
                        <label htmlFor="password">Unique initial password (at least 12 characters)</label>
                        <InputText
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            {...register("password")}
                            className={errors.password ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.password && <small className="p-error">{errors.password.message}</small>}
                        <small className="block mt-1">Share it privately with the family and ask them to change it after signing in.</small>
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

                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="religion">Religion</label>
                            <Controller
                                name="religion"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="religion"
                                        {...field}
                                        options={religionOptions}
                                        placeholder="Select Religion"
                                        className={errors.religion ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.religion && <small className="p-error">{errors.religion.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="house">House</label>
                            <Controller
                                name="house"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="house"
                                        {...field}
                                        options={houseOptions}
                                        placeholder="Select House"
                                        className={errors.house ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.house && <small className="p-error">{errors.house.message}</small>}
                        </div>
                    </div>

                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <label htmlFor="section">Section</label>
                            {selectedClassData?.section ? (
                                <InputText id="section" value={selectedClassData.section} readOnly className="w-full" />
                            ) : (
                                <Controller
                                    name="section"
                                    control={control}
                                    render={({ field }) => (
                                        <Dropdown
                                            id="section"
                                            {...field}
                                            options={sectionOptions}
                                            placeholder="Select Section"
                                            className={errors.section ? "p-invalid w-full" : "w-full"}
                                        />
                                    )}
                                />
                            )}
                            {errors.section && <small className="p-error">{errors.section.message}</small>}
                        </div>
                    </div>

                    <div className="p-field">
                        <label htmlFor="address">Address</label>
                        <InputTextarea
                            rows={3}
                            id="address"
                            {...register("address")}
                            className={errors.address ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.address && <small className="p-error">{errors.address.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="guardianMode">Parent/Guardian</label>
                        <Controller
                            name="guardianMode"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="guardianMode"
                                    value={field.value}
                                    options={[
                                        { label: "Link an existing parent/guardian", value: "existing" },
                                        { label: "Create a new parent/guardian", value: "new" },
                                    ]}
                                    onChange={(e) => field.onChange(e.value)}
                                    placeholder="Choose guardian option"
                                    className="w-full"
                                />
                            )}
                        />
                    </div>

                    {guardianMode === "existing" ? (
                        <div className="p-field">
                            <label htmlFor="parentid">Select Parent/Guardian</label>
                            <Controller
                                name="parentid"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="parentid"
                                        value={field.value}
                                        options={parentOptions} // Use memoized data
                                        onChange={(e) => field.onChange(e.value)}
                                        filter
                                        filterBy="label"
                                        filterPlaceholder="Search parent..."
                                        showClear
                                        placeholder="Select Parent"
                                        className={(errors as any).parentid ? "p-invalid w-full" : "w-full"}
                                        disabled={loading} // Disable while loading
                                    />
                                )}
                            />
                            {(errors as any).parentid && <small className="p-error">{(errors as any).parentid.message}</small>}
                        </div>
                    ) : (
                        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                            <p className="font-medium text-gray-800">New parent/guardian account</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="newGuardian.title">Title</label>
                                    <InputText id="newGuardian.title" {...register("newGuardian.title")} className="w-full" />
                                    {(errors as any).newGuardian?.title && <small className="p-error">{(errors as any).newGuardian.title.message}</small>}
                                </div>
                                <div>
                                    <label htmlFor="newGuardian.gender">Gender</label>
                                    <Controller
                                        name="newGuardian.gender"
                                        control={control}
                                        render={({ field }) => (
                                            <Dropdown id="newGuardian.gender" {...field} options={genderOptions} placeholder="Select Gender" className="w-full" />
                                        )}
                                    />
                                    {(errors as any).newGuardian?.gender && <small className="p-error">{(errors as any).newGuardian.gender.message}</small>}
                                </div>
                                <div>
                                    <label htmlFor="newGuardian.firstname">First Name</label>
                                    <InputText id="newGuardian.firstname" {...register("newGuardian.firstname")} className="w-full" />
                                    {(errors as any).newGuardian?.firstname && <small className="p-error">{(errors as any).newGuardian.firstname.message}</small>}
                                </div>
                                <div>
                                    <label htmlFor="newGuardian.surname">Surname</label>
                                    <InputText id="newGuardian.surname" {...register("newGuardian.surname")} className="w-full" />
                                    {(errors as any).newGuardian?.surname && <small className="p-error">{(errors as any).newGuardian.surname.message}</small>}
                                </div>
                                <div>
                                    <label htmlFor="newGuardian.othername">Other Name</label>
                                    <InputText id="newGuardian.othername" {...register("newGuardian.othername")} className="w-full" />
                                </div>
                                <div>
                                    <label htmlFor="newGuardian.phone">Phone (login username)</label>
                                    <InputText id="newGuardian.phone" {...register("newGuardian.phone")} className="w-full" />
                                    {(errors as any).newGuardian?.phone && <small className="p-error">{(errors as any).newGuardian.phone.message}</small>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="newGuardian.password">Unique initial password (at least 12 characters)</label>
                                <InputText id="newGuardian.password" type="password" autoComplete="new-password" {...register("newGuardian.password")} className="w-full" />
                                {(errors as any).newGuardian?.password && <small className="p-error">{(errors as any).newGuardian.password.message}</small>}
                                <small className="block mt-1">Share it privately with the guardian and ask them to change it after signing in.</small>
                            </div>
                        </div>
                    )}

                    <div className="p-field">
                            <label htmlFor="classid">Class</label>
                            <Controller
                                name="classid"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="classid"
                                        {...field}
                                        options={classOptions} // Use memoized data
                                        onChange={(e) => {
                                            field.onChange(e.value);
                                            const selectedClass = classData?.find((schoolClass) => schoolClass.id === e.value);
                                            if (selectedClass?.section) setValue("section", selectedClass.section);
                                        }}
                                        placeholder="Select Class"
                                        className={errors.classid ? "p-invalid w-full" : "w-full"}
                                        disabled={loading} // Disable while loading
                                    />
                                )}
                            />
                            {errors.classid && <small className="p-error">{errors.classid.message}</small>}
                    </div>

                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button
                            label="Cancel"
                            type="button"
                            outlined
                            onClick={handleBack}
                        />
                        <Button
                            label="Review Admission"
                            type="submit"
                            className="p-button-primary"
                            disabled={saving || loading}
                        />
                    </div>
                </form>
            </div>

            <Dialog
                header="Review admission"
                visible={Boolean(pendingAdmission)}
                onHide={() => setPendingAdmission(null)}
                footer={(
                    <div className="flex justify-end gap-2">
                        <Button label="Back to form" outlined onClick={() => setPendingAdmission(null)} disabled={saving} />
                        <Button label="Confirm admission" onClick={confirmAdmission} loading={saving} disabled={saving} />
                    </div>
                )}
            >
                <p>Check these details before creating the official student record.</p>
                <dl className="mt-4 grid grid-cols-1 gap-3">
                    <div><dt className="font-semibold">Student</dt><dd>{`${pendingAdmission?.firstname ?? ""} ${pendingAdmission?.othername ?? ""} ${pendingAdmission?.surname ?? ""}`.trim()}</dd></div>
                    <div><dt className="font-semibold">Class</dt><dd>{reviewClassName}</dd></div>
                    <div><dt className="font-semibold">Parent/guardian</dt><dd>{reviewGuardianName}</dd></div>
                    {pendingAdmission?.guardianMode === "new" && <div><dt className="font-semibold">Guardian phone</dt><dd>{pendingAdmission.newGuardian.phone}</dd></div>}
                </dl>
            </Dialog>

            <Dialog
                header="Admission completed"
                visible={Boolean(createdAdmission)}
                closable={false}
                onHide={() => undefined}
                footer={<Button label="Done" onClick={() => { setCreatedAdmission(null); router.back(); }} />}
            >
                {createdAdmission && (
                    <div className="space-y-2">
                        <p>The student record and guardian link were saved.</p>
                        <p><strong>Admission number:</strong> {createdAdmission.admissionnumber}</p>
                        <p><strong>Student:</strong> {`${createdAdmission.firstname} ${createdAdmission.othername ?? ""} ${createdAdmission.surname}`.trim()}</p>
                        <p><strong>Class:</strong> {createdAdmission.class.name}</p>
                        <p><strong>Parent/guardian:</strong> {`${createdAdmission.parent.title} ${createdAdmission.parent.firstname} ${createdAdmission.parent.surname}`.trim()}</p>
                        <p><strong>Guardian login username:</strong> {createdAdmission.parent.phone}</p>
                        <p className="text-sm text-gray-600">The guardian's unique initial password was set in the form. Share it privately.</p>
                    </div>
                )}
            </Dialog>
        </section>
    );
};

export default NewStudent;
