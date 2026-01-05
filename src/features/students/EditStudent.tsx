"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { studentSchema, StudentSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

import { useGetStudentById, useUpdateStudent } from "@/hooks/useStudents";
import { useGetParents } from "@/hooks/useParents";
import { useGetClasses } from "@/hooks/useClasses";
import { Parent as ParentType, Class as ClassType } from "@/generated/prisma";

interface Option {
    label: string;
    value: string;
}

const genderOptions = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

const sectionOptions = [
    { label: "Pre-Nursery", value: "PRE-NURSERY" },
    { label: "Nursery", value: "NURSERY" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
];

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

const religionOptions = [
    { label: "Christianity", value: "Christianity" },
    { label: "Islam", value: "Islam" },
    { label: "Traditional", value: "Traditional" },
    { label: "Other", value: "Other" },
];

const houseOptions = [
    { label: "Blue House", value: "Blue House" },
    { label: "Green House", value: "Green House" },
    { label: "Yellow House", value: "Yellow House" },
    { label: "Pink House", value: "Pink House" },
    { label: "Red House", value: "Red House" },
    { label: "White House", value: "White House" },
];

const EditStudent: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const studentId = params.id as string;

    // --- React Query Hooks ---
    const { data: studentData, isLoading: isLoadingStudent, isError: isErrorStudent } = useGetStudentById(
        studentId,
        { enabled: !!studentId }
    );

    const { data: parentsData, isLoading: isLoadingParents } = useGetParents();
    const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();

    const updateStudentMutation = useUpdateStudent();
    const isUpdating = (updateStudentMutation as any).isPending ?? (updateStudentMutation as any).isLoading ?? false;

    const isLoading = isLoadingStudent || isLoadingParents || isLoadingClasses;

    // form
    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
        register,
    } = useForm({
        resolver: zodResolver(studentSchema),
        mode: "onBlur",
        defaultValues: {
            admissionnumber: "",
            firstname: "",
            surname: "",
            othername: "",
            birthday: undefined,
            gender: undefined,
            religion: "",
            house: "",
            bloodgroup: "",
            admissiondate: undefined,
            section: "",
            state: "",
            lga: "",
            address: "",
            parentid: "",
            classid: "",
            avarta: "",
            active: true,
        },
    });

    // --- Build dropdown options ensuring fallback entries exist for current selection ---
    const parents: Option[] = useMemo(() => {
        const arr: Option[] = (parentsData || []).map((p: ParentType) => ({
            label: `${p.firstname || ""} ${p.surname || ""}`.trim() || "Unknown",
            value: p.id,
        }));

        // If student has parentid but parent isn't in list, prepend fallback
        if (studentData?.parentid && !arr.some((x) => x.value === studentData.parentid)) {
            const fallbackLabel =
                (studentData as any).parent
                    ? `${(studentData as any).parent.firstname || ""} ${(studentData as any).parent.surname || ""}`.trim()
                    : `Parent (${studentData.parentid})`;
            arr.unshift({ label: fallbackLabel || "Unknown Parent", value: studentData.parentid });
        }

        return arr;
    }, [parentsData, studentData]);

    const classes: Option[] = useMemo(() => {
        const arr: Option[] = (classesData || []).map((c: ClassType | any) => ({
            label: c.name || "Unknown",
            value: c.id,
        }));

        // If student has classid but class isn't in list, prepend fallback
        if (studentData?.classid && !arr.some((x) => x.value === studentData.classid)) {
            const fallbackLabel = (studentData as any).class?.name || `Class (${studentData.classid})`;
            arr.unshift({ label: fallbackLabel || "Unknown Class", value: studentData.classid });
        }

        return arr;
    }, [classesData, studentData]);

    // Populate the non-dropdown fields whenever studentData arrives
    useEffect(() => {
        if (!studentData) return;

        setValue("admissionnumber", studentData.admissionnumber || "");
        setValue("firstname", studentData.firstname || "");
        setValue("surname", studentData.surname || "");
        setValue("othername", studentData.othername || "");
        setValue("birthday", studentData.birthday ? new Date(studentData.birthday) : "");
        setValue("gender", studentData.gender || undefined);
        setValue("religion", studentData.religion || "");
        setValue("house", studentData.house || "");
        setValue("bloodgroup", studentData.bloodgroup || "");
        setValue("section", studentData.section || "");
        setValue("state", studentData.state || "");
        setValue("lga", studentData.lga || "");
        setValue("address", studentData.address || "");
        setValue("admissiondate", studentData.admissiondate ? new Date(studentData.admissiondate) : "");
        setValue("active", studentData.active !== undefined ? studentData.active : true);
    }, [studentData, setValue]);

    // Ensure the dropdowns are preselected AFTER options arrays exist.
    // This avoids the race where setValue runs before options include the value.
    useEffect(() => {
        if (!studentData) return;

        // debug: remove if not needed
        // console.debug("preselect parents/classes", { studentParentId: studentData.parentid, parents, studentClassId: studentData.classid, classes });

        if (typeof studentData.parentid === "string" && studentData.parentid !== "") {
            // Only set if parentid exists
            setValue("parentid", studentData.parentid);
        }

        if (typeof studentData.classid === "string" && studentData.classid !== "") {
            setValue("classid", studentData.classid);
        }
    }, [studentData, parents, classes, setValue]);

    // Submission
    const onSubmit = async (data: StudentSchema) => {
        if (!studentId) {
            toast.current?.show({ severity: "error", summary: "Invalid Student", detail: "Student ID is missing." });
            return;
        }

        try {
            const payload = {
                ...data,
                birthday: data.birthday ? (data.birthday instanceof Date ? data.birthday : new Date(data.birthday)) : undefined,
                admissiondate: data.admissiondate ? (data.admissiondate instanceof Date ? data.admissiondate : new Date(data.admissiondate)) : undefined,
            };

            await updateStudentMutation.mutateAsync({ id: studentId, data: payload });
            toast.current?.show({ severity: "success", summary: "Student Updated", detail: "Student has been updated successfully." });
            setTimeout(() => router.back(), 1200);
        } catch (err: any) {
            console.error(err);
            toast.current?.show({ severity: "error", summary: "Update Error", detail: err.message || "Failed to update student." });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    if (isErrorStudent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <h3 className="text-xl text-red-600">Error loading student data. Please check the ID and try again.</h3>
            </div>
        );
    }

    return (
        <section className="w-[96%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {isUpdating && <Spinner visible onHide={() => { }} />}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80 p-4">Edit Student</h2>
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="bg-red-600 text-white rounded-lg text-base font-bold border border-red-600 hidden sm:inline-flex items-center gap-2 py-2 px-3 mr-4 hover:bg-red-700 hover:border-red-700 transition-all duration-300"
                    onClick={() => router.back()}
                />
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* first row */}
                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* surname */}
                    <div className="p-field">
                        <label htmlFor="surname">Surname</label>
                        <InputText id="surname" {...register("surname")} className={errors.surname ? "p-invalid w-full" : "w-full"} />
                        {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                    </div>

                    {/* birthday / gender */}
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
                            <Controller name="gender" control={control} render={({ field }) => <Dropdown id="gender" {...field} options={genderOptions} optionLabel="label" optionValue="value" placeholder="Select Gender" className={errors.gender ? "p-invalid w-full" : "w-full"} />} />
                            {errors.gender && <small className="p-error">{errors.gender.message}</small>}
                        </div>
                    </div>

                    {/* religion / house */}
                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="religion">Religion</label>
                            <Controller name="religion" control={control} render={({ field }) => <Dropdown id="religion" {...field} options={religionOptions} optionLabel="label" optionValue="value" placeholder="Select Religion" className={errors.religion ? "p-invalid w-full" : "w-full"} />} />
                            {errors.religion && <small className="p-error">{errors.religion.message}</small>}
                        </div>
                        <div>
                            <label htmlFor="house">House</label>
                            <Controller name="house" control={control} render={({ field }) => <Dropdown id="house" {...field} options={houseOptions} optionLabel="label" optionValue="value" placeholder="Select House" className={errors.house ? "p-invalid w-full" : "w-full"} />} />
                            {errors.house && <small className="p-error">{errors.house.message}</small>}
                        </div>
                    </div>

                    {/* bloodgroup / section */}
                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bloodgroup">Blood Group</label>
                            <Controller name="bloodgroup" control={control} render={({ field }) => <Dropdown id="bloodgroup" {...field} options={bloodgroupOptions} optionLabel="label" optionValue="value" placeholder="Select Blood Group" className={errors.bloodgroup ? "p-invalid w-full" : "w-full"} />} />
                            {errors.bloodgroup && <small className="p-error">{errors.bloodgroup.message}</small>}
                        </div>

                        <div>
                            <label htmlFor="section">Section</label>
                            <Controller name="section" control={control} render={({ field }) => <Dropdown id="section" {...field} options={sectionOptions} optionLabel="label" optionValue="value" placeholder="Select Section" className={errors.section ? "p-invalid w-full" : "w-full"} />} />
                            {errors.section && <small className="p-error">{errors.section.message}</small>}
                        </div>
                    </div>

                    <div className="p-field">
                        <label htmlFor="address">Address</label>
                        <InputTextarea rows={3} id="address" {...register("address")} className={errors.address ? "p-invalid w-full" : "w-full"} />
                        {errors.address && <small className="p-error">{errors.address.message}</small>}
                    </div>

                    {/* Parent / Class dropdowns */}
                    <div className="p-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="parentid">Parent</label>
                            <Controller
                                name="parentid"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="parentid"
                                        {...field}
                                        options={parents}
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder={isLoadingParents ? "Loading Parents..." : "Select Parent"}
                                        className={errors.parentid ? "p-invalid w-full" : "w-full"}
                                        loading={isLoadingParents}
                                        disabled={isLoadingParents}
                                        filter
                                        showClear
                                    />
                                )}
                            />
                            {errors.parentid && <small className="p-error">{errors.parentid.message}</small>}
                        </div>

                        <div>
                            <label htmlFor="classid">Class</label>
                            <Controller
                                name="classid"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="classid"
                                        {...field}
                                        options={classes}
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder={isLoadingClasses ? "Loading Classes..." : "Select Class"}
                                        className={errors.classid ? "p-invalid w-full" : "w-full"}
                                        loading={isLoadingClasses}
                                        disabled={isLoadingClasses}
                                        filter
                                        showClear
                                    />
                                )}
                            />
                            {errors.classid && <small className="p-error">{errors.classid.message}</small>}
                        </div>
                    </div>

                    <div className="p-field">
                        <label htmlFor="admissiondate">Admission Date</label>
                        <Controller name="admissiondate" control={control} render={({ field }) => <Calendar id="admissiondate" value={field.value instanceof Date || field.value === undefined ? field.value : field.value ? new Date(field.value) : null} onChange={(e) => field.onChange(e.value)} onBlur={field.onBlur} dateFormat="dd/mm/yy" placeholder="Select Date" className={errors.admissiondate ? "p-invalid w-full" : "w-full"} />} />
                        {errors.admissiondate && <small className="p-error">{errors.admissiondate.message}</small>}
                    </div>

                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={() => router.back()} />
                        <Button label="Update" type="submit" className="p-button-primary" loading={isUpdating} disabled={isUpdating} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditStudent;
