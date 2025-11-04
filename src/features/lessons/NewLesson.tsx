'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLesson } from '@/lib/api/lessons';
import { fetchClasses, fetchTeachers, fetchSubjects } from '@/lib/api/common';
import type { Lesson } from '@/types';

const lessonSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: z.date(),
    endTime: z.date(),
    subjectid: z.string().min(1),
    classid: z.string().min(1),
    teacherid: z.string().min(1),
});

type FormData = z.infer<typeof lessonSchema>;

interface NewLessonProps {
    visible: boolean;
    onHide: () => void;
    onSuccess: (lesson: Lesson) => void;
    selectedClassId?: string;
}

export default function NewLesson({
    visible,
    onHide,
    onSuccess,
    selectedClassId,
}: NewLessonProps) {
    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(lessonSchema),
    });

    const [classOptions, setClassOptions] = useState<any[]>([]);
    const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
    const [teacherOptions, setTeacherOptions] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [c, s, t] = await Promise.all([fetchClasses(), fetchSubjects(), fetchTeachers()]);
                console.log("Classes: ", c)
                setClassOptions(c.map((x: any) => ({ label: x.name, value: x.id })));
                setSubjectOptions(s.map((x: any) => ({ label: x.name, value: x.id })));
                setTeacherOptions(t.map((x: any) => ({ label: `${x.firstname} ${x.surname}`, value: x.id })));
            } catch (err) {
                console.error('Failed to load form options', err);
                setClassOptions([]);
                setSubjectOptions([]);
                setTeacherOptions([]);
            }
        };
        if (visible) load();
    }, [visible]);

    useEffect(() => {
        if (selectedClassId) {
            setValue('classid', selectedClassId);
        }
    }, [selectedClassId, setValue]);

    const onSubmit = async (data: FormData) => {
        const payload = {
            ...data,
            startTime: data.startTime.toISOString(),
            endTime: data.endTime.toISOString(),
        };

        try {
            const newLesson = await createLesson(payload);
            onSuccess(newLesson);
            reset();
        } catch (err: any) {
            // show error to user / toast etc. For now log
            console.error('Failed to create lesson', err);
            throw err;
        }
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button
                label="Create"
                icon="pi pi-check"
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                className="p-button-success"
            />
        </div>
    );

    return (
        <Dialog
            header="Create New Lesson"
            visible={visible}
            onHide={onHide}
            footer={footer}
            modal
            className="w-full max-w-2xl"
        >
            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Lesson Name</label>
                    <InputText {...register('name')} className="w-full" placeholder="e.g. Mathematics Period 1" />
                    {errors.name && <small className="text-red-600">{errors.name.message}</small>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Day</label>
                        <Controller
                            name="day"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    options={[
                                        { label: 'Monday', value: 'MONDAY' },
                                        { label: 'Tuesday', value: 'TUESDAY' },
                                        { label: 'Wednesday', value: 'WEDNESDAY' },
                                        { label: 'Thursday', value: 'THURSDAY' },
                                        { label: 'Friday', value: 'FRIDAY' },
                                        { label: 'Saturday', value: 'SATURDAY' },
                                        { label: 'Sunday', value: 'SUNDAY' },
                                    ]}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    placeholder="Select day"
                                    className="w-full"
                                />
                            )}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Class</label>
                        <Controller
                            name="classid"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    options={classOptions}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    placeholder="Select class"
                                    className="w-full"
                                    disabled={!!selectedClassId}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <Controller
                            name="startTime"
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    timeOnly
                                    hourFormat="24"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.startTime && <small className="text-red-600">{String(errors.startTime.message)}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <Controller
                            name="endTime"
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    timeOnly
                                    hourFormat="24"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.endTime && <small className="text-red-600">{String(errors.endTime.message)}</small>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <Controller
                            name="subjectid"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    options={subjectOptions}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    placeholder="Select subject"
                                    className="w-full"
                                    filter
                                />
                            )}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Teacher</label>
                        <Controller
                            name="teacherid"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    options={teacherOptions}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    placeholder="Select teacher"
                                    className="w-full"
                                    filter
                                />
                            )}
                        />
                    </div>
                </div>
            </form>
        </Dialog>
    );
}
