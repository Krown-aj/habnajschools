"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";
import profilePic from "@/assets/profile1.png";

type Role = "super" | "admin" | "teacher" | "student" | "parent" | "Guest" | string;

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

export default function Profile() {
    const toast = useRef<Toast | null>(null);
    const { data: session, status } = useSession();
    const isSessionLoading = status === "loading";

    const userId = session?.user?.id as string | undefined;
    const role = (session?.user?.role as Role) ?? "Guest";

    const [profile, setProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    // derive endpoint
    const profileEndpoint = useMemo(() => {
        if (!userId) return null;
        const r = String(role).toLowerCase();
        if (r === "super" || r === "admin") return `/api/administrations/${userId}`;
        if (r === "teacher") return `/api/teachers/${userId}`;
        if (r === "student") return `/api/students/${userId}`;
        if (r === "parent") return `/api/parents/${userId}`;
        return `/api/students/${userId}`;
    }, [role, userId]);

    // helpers for dates
    const formatDateForInput = (d?: string | Date) => {
        if (!d) return "";
        const date = new Date(d);
        if (Number.isNaN(date.getTime())) return "";
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };
    const displayDate = (d?: string | Date) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString();
    };

    // flatten profile => default form values
    const shapeToDefaults = (p: any) => ({
        title: p?.title ?? "",
        qualification: p?.qualification ?? "",
        username: p?.username ?? "",
        firstname: p?.firstname ?? "",
        othername: p?.othername ?? "",
        surname: p?.surname ?? "",
        birthday: p?.birthday ? new Date(p.birthday) : null,
        gender: p?.gender ?? null,
        bloodgroup: p?.bloodgroup ?? "",
        email: p?.email ?? "",
        phone: p?.phone ?? "",
        address: p?.address ?? "",
        state: p?.state ?? "",
        lga: p?.lga ?? "",
        avarta: p?.avarta ?? "",
    });

    // react-hook-form setup
    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
        watch,
    } = useForm({
        mode: "onBlur",
        defaultValues: shapeToDefaults({}),
    });

    // fetch profile from server
    const fetchProfile = useCallback(async () => {
        if (!profileEndpoint) return;
        setLoadingProfile(true);
        try {
            const res = await fetch(profileEndpoint);
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `Failed to load profile (${res.status})`);
            }
            const data = await res.json();
            const payload = data?.data ?? data ?? {};
            setProfile(payload);
            // only reset the form when not currently editing 
            reset(shapeToDefaults(payload));
        } catch (err: any) {
            console.error("fetchProfile error", err);
            toast.current?.show({ severity: "error", summary: "Profile", detail: err?.message || "Failed to load profile" });
        } finally {
            setLoadingProfile(false);
        }
    }, [profileEndpoint, reset]);

    useEffect(() => {
        if (!isSessionLoading && profileEndpoint) fetchProfile();
    }, [isSessionLoading, profileEndpoint, fetchProfile]);

    // save profile patch
    const saveProfile = useCallback(
        async (patch: Record<string, any>) => {
            if (!profileEndpoint) throw new Error("No profile endpoint");
            setSaving(true);
            try {
                const res = await fetch(profileEndpoint, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                });
                let json: any = {};
                try {
                    json = await res.json();
                } catch { }
                if (!res.ok) {
                    const msg = json?.error || `Failed to save (status ${res.status})`;
                    throw new Error(msg);
                }
                const updated = json?.data ?? json ?? {};
                const newProfile = Object.keys(updated).length ? updated : { ...(profile ?? {}), ...patch };
                setProfile(newProfile);
                // reset form to server truth to remove dirty state
                reset(shapeToDefaults(newProfile));
                toast.current?.show({ severity: "success", summary: "Saved", detail: "Profile updated." });
                return newProfile;
            } catch (err: any) {
                console.error("saveProfile error", err);
                toast.current?.show({ severity: "error", summary: "Save failed", detail: err?.message || String(err) });
                throw err;
            } finally {
                setSaving(false);
            }
        },
        [profileEndpoint, profile, reset]
    );

    // ImageView onChange will receive UploadResult and we patch avarta and await server update
    const handleAvatarChange = useCallback(
        async (meta: UploadResult) => {
            return saveProfile({ avarta: meta.path });
        },
        [saveProfile]
    );

    // form submit handler: build role-appropriate patch and call saveProfile
    const onSubmit = async (vals: any) => {
        // build patch: convert birthday Date to ISO if present
        const patch: Record<string, any> = {};
        // role-specific fields — we only submit fields relevant to role (teacher/student/parent/admin)
        // for simplicity include common profile fields:
        if (vals.qualification !== undefined) patch.qualification = vals.qualification;
        if (vals.title !== undefined) patch.title = vals.title;
        if (vals.username !== undefined) patch.username = vals.username;
        if (vals.firstname !== undefined) patch.firstname = vals.firstname;
        if (vals.othername !== undefined) patch.othername = vals.othername;
        if (vals.surname !== undefined) patch.surname = vals.surname;
        if (vals.birthday) patch.birthday = new Date(vals.birthday).toISOString();
        if (vals.gender !== undefined) patch.gender = vals.gender;
        if (vals.bloodgroup !== undefined) patch.bloodgroup = vals.bloodgroup;
        if (vals.email !== undefined) patch.email = vals.email;
        if (vals.phone !== undefined) patch.phone = vals.phone;
        if (vals.address !== undefined) patch.address = vals.address;
        if (vals.state !== undefined) patch.state = vals.state;
        if (vals.lga !== undefined) patch.lga = vals.lga;

        try {
            await saveProfile(patch);
            setEditMode(false);
        } catch {
            // toast shown in saveProfile
        }
    };

    const handleStartEdit = () => setEditMode(true);
    const handleCancel = () => {
        setEditMode(false);
        reset(shapeToDefaults(profile ?? {}));
    };

    // role-specific fields to render (gender dropdown, bloodgroup dropdown, title dropdown included)
    const fieldsByRole = (r: Role) => {
        const common = [
            { key: "title", label: "Title", type: "select" },
            { key: "qualification", label: "Qualification", type: "select", required: true },
            { key: "firstname", label: "First name", type: "text", required: true },
            { key: "othername", label: "Other name", type: "text" },
            { key: "surname", label: "Surname", type: "text", required: true },
            { key: "birthday", label: "Birthday", type: "date" },
            { key: "gender", label: "Gender", type: "select" },
            { key: "bloodgroup", label: "Blood group", type: "select" },
            { key: "email", label: "Email", type: "email", required: true },
            { key: "phone", label: "Phone", type: "text" },
            { key: "address", label: "Address", type: "textarea" },
            { key: "state", label: "State", type: "text" },
            { key: "lga", label: "LGA", type: "text" },
        ];

        switch (String(r).toLowerCase()) {
            case "teacher":
                return common;
            case "student":
                return common;
            case "parent":
                return common;
            case "super":
            case "admin":
                // admin has fewer personal fields — still show email & phone
                return [
                    { key: "email", label: "Email", type: "email", required: true },
                    { key: "username", label: "Username", type: "text" },
                ];
            default:
                return common;
        }
    };

    // avatar info for ImageView
    const avatarPath = typeof profile?.avarta === "string" && profile.avarta.startsWith("/") ? profile.avarta : undefined;
    const avatarPlaceholder = profile?.avarta && typeof profile.avarta === "string" && /^https?:\/\//i.test(profile.avarta) ? profile.avarta : profilePic;

    // UX while loading
    if (isSessionLoading || loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 lg:p-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                        <h2 className="text-lg font-semibold">Not signed in</h2>
                        <p className="text-sm text-gray-500 mt-2">Please sign in to view your profile.</p>
                    </div>
                </div>
            </main>
        );
    }

    const displayName =
        profile?.firstname || profile?.surname
            ? `${profile.firstname ?? ""} ${profile.othername ? profile.othername + " " : ""}${profile.surname ?? ""}`.trim()
            : profile?.username ?? profile?.email ?? "Profile";

    const roleFields = fieldsByRole(role);

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 lg:p-12">
            <Toast ref={toast} />
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    {/* Avatar center */}
                    <div className="flex flex-col items-center">
                        <div className="relative" style={{ overflow: "visible", paddingBottom: 18 }}>
                            <div className="w-40 h-40 rounded-full overflow-hidden">
                                <ImageView
                                    path={avatarPath}
                                    onChange={handleAvatarChange}
                                    placeholder={avatarPlaceholder}
                                    className="rounded-full"
                                    width={160}
                                    height={160}
                                    alt={displayName}
                                    editable={true}
                                />
                            </div>
                        </div>

                        <div className="mt-4 text-center">
                            <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
                            <p className="text-sm text-gray-500 mt-1">{profile?.email ?? "—"}</p>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            {!editMode ? (
                                <Button label="Edit Profile" icon="pi pi-pencil" onClick={handleStartEdit} className="rounded-lg" />
                            ) : (
                                <>
                                    <Button label="Save" icon="pi pi-save" onClick={handleSubmit(onSubmit)} loading={saving} className="p-button-success rounded-lg" />
                                    <Button label="Cancel" icon="pi pi-times" onClick={handleCancel} className="p-button-text" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Form / Details */}
                    <div className="mt-6">
                        <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {roleFields.map((f) => {
                                    // non-edit display mode
                                    if (!editMode) {
                                        return (
                                            <div key={f.key} className="py-2">
                                                <div className="text-xs text-gray-600 font-bold">{f.label}</div>
                                                <div className="text-sm text-gray-800 mt-1">
                                                    {f.type === "date" ? displayDate(profile?.[f.key]) : profile?.[f.key] ?? "—"}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // edit mode: render appropriate controlled input
                                    return (
                                        <div key={f.key} className="py-2">
                                            <div className="text-xs text-gray-600 font-medium mb-1">{f.label}{f.required ? " *" : ""}</div>

                                            {f.type === "select" && f.key === "title" && (
                                                <Controller
                                                    control={control}
                                                    name="title"
                                                    rules={{ required: f.required ? "Title is required" : false }}
                                                    render={({ field }) => (
                                                        <Dropdown
                                                            value={field.value}
                                                            options={titleOptions}
                                                            onChange={(e) => field.onChange(e.value)}
                                                            placeholder="Select title"
                                                            className={errors.title ? "p-invalid w-full" : "w-full"}
                                                        />
                                                    )}
                                                />
                                            )}

                                            {f.type === "select" && f.key === "qualification" && (
                                                <Controller
                                                    control={control}
                                                    name="qualification"
                                                    rules={{ required: f.required ? "Qualification is required" : false }}
                                                    render={({ field }) => (
                                                        <Dropdown
                                                            value={field.value}
                                                            options={qualificationOptions}
                                                            onChange={(e) => field.onChange(e.value)}
                                                            placeholder="Select qualification"
                                                            className={errors.qualification ? "p-invalid w-full" : "w-full"}
                                                        />
                                                    )}
                                                />
                                            )}

                                            {f.type === "select" && f.key === "gender" && (
                                                <Controller
                                                    control={control}
                                                    name="gender"
                                                    rules={{ required: f.required ? "Gender is required" : false }}
                                                    render={({ field }) => (
                                                        <Dropdown
                                                            value={field.value}
                                                            options={genderOptions}
                                                            onChange={(e) => field.onChange(e.value)}
                                                            placeholder="Select gender"
                                                            className={errors.gender ? "p-invalid w-full" : "w-full"}
                                                        />
                                                    )}
                                                />
                                            )}

                                            {f.type === "select" && f.key === "bloodgroup" && (
                                                <Controller
                                                    control={control}
                                                    name="bloodgroup"
                                                    render={({ field }) => (
                                                        <Dropdown
                                                            value={field.value}
                                                            options={bloodgroupOptions}
                                                            onChange={(e) => field.onChange(e.value)}
                                                            placeholder="Select blood group"
                                                            className={errors.bloodgroup ? "p-invalid w-full" : "w-full"}
                                                        />
                                                    )}
                                                />
                                            )}

                                            {f.type === "date" && (
                                                <Controller
                                                    control={control}
                                                    name="birthday"
                                                    rules={{}}
                                                    render={({ field }) => (
                                                        <Calendar
                                                            value={field.value ?? null}
                                                            onChange={(e) => field.onChange(e.value)}
                                                            dateFormat="dd/mm/yy"
                                                            placeholder="Select Date"
                                                            className={errors.birthday ? "p-invalid w-full" : "w-full"}
                                                        />
                                                    )}
                                                />
                                            )}

                                            {f.type === "textarea" && (
                                                <Controller
                                                    control={control}
                                                    name={f.key as any}
                                                    rules={{}}
                                                    render={({ field }) => (
                                                        <InputTextarea rows={3} value={field.value ?? ""} onChange={(e) => field.onChange((e.target as HTMLTextAreaElement).value)} className={errors[f.key as keyof typeof errors] ? "p-invalid w-full" : "w-full"} />
                                                    )}
                                                />
                                            )}

                                            {(f.type === "text" || f.type === "email") && (
                                                <>
                                                    <Controller
                                                        control={control}
                                                        name={f.key as any}
                                                        rules={{
                                                            required: f.required ? `${f.label} is required` : false,
                                                            ...(f.type === "email"
                                                                ? {
                                                                    pattern: {
                                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                                                                        message: "Invalid email address",
                                                                    },
                                                                }
                                                                : {}),
                                                            ...(f.key === "phone"
                                                                ? {
                                                                    minLength: { value: 7, message: "Phone is too short" },
                                                                    maxLength: { value: 20, message: "Phone is too long" },
                                                                }
                                                                : {}),
                                                        }}
                                                        render={({ field }) => (
                                                            <InputText
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                                                type={f.type === "email" ? "email" : "text"}
                                                                className={errors[f.key as keyof typeof errors] ? "p-invalid w-full" : "w-full"}
                                                            />
                                                        )}
                                                    />
                                                </>
                                            )}

                                            {/* show validation message */}
                                            {errors[f.key as keyof typeof errors] && (
                                                <small className="p-error">{(errors[f.key as keyof typeof errors] as any)?.message}</small>
                                            )}
                                        </div>
                                    );
                                })}
                            </form>
                        </div>

                        {/* role-specific extras */}
                        <div className="mt-4 bg-white rounded-lg border border-gray-100 p-4">
                            {role === "student" && (
                                <>
                                    <div className="text-sm text-gray-600">Admission date</div>
                                    <div className="text-sm text-gray-800 mb-3">{displayDate(profile?.admissiondate)}</div>
                                    <div className="text-sm text-gray-600">Class</div>
                                    <div className="text-sm text-gray-800">{profile?.class?.name ?? profile?.classid ?? "—"}</div>
                                </>
                            )}

                            {role === "teacher" && (
                                <>
                                    <div className="text-sm text-gray-600">Subjects</div>
                                    <div className="text-sm text-gray-800">{Array.isArray(profile?.subjects) ? profile.subjects.map((s: any) => s.name).join(", ") : "—"}</div>
                                </>
                            )}

                            {role === "parent" && (
                                <>
                                    <div className="text-sm text-gray-600">Children</div>
                                    <div className="text-sm text-gray-800">{Array.isArray(profile?.students) ? profile.students.map((s: any) => `${s.firstname} ${s.surname}`).join(", ") : "—"}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
