'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import LessonsTable from './LessonsTable';
import NewLesson from './NewLesson';
import { fetchClasses as fetchClassesApi } from '@/lib/api/common';
import { fetchLessonsByClass as fetchLessonsByClassApi } from '@/lib/api/lessons';
import type { Class as ClassType, Lesson } from '@/types';

export default function Lessons(): React.ReactElement {
    const { data: session } = useSession();

    const [classes, setClasses] = useState<ClassType[]>([]);
    const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const role = (session?.user?.role as string) || 'Guest';
    const isAdminOrSuper = ['super', 'admin', 'management'].includes(role.toLowerCase());

    useEffect(() => {
        const loadClasses = async () => {
            setLoadingClasses(true);
            try {
                const data = await fetchClassesApi();
                const list = Array.isArray(data) ? data : [];
                setClasses(list);
                setClassOptions(list.map((c) => ({ label: c.name, value: c.id })));
            } catch (err) {
                console.error('Failed to load classes', err);
                setClasses([]);
                setClassOptions([]);
            } finally {
                setLoadingClasses(false);
            }
        };
        loadClasses();
    }, []);

    useEffect(() => {
        if (!selectedClassId) {
            setLessons([]);
            return;
        }

        setLoadingLessons(true);
        (async () => {
            try {
                const data = await fetchLessonsByClassApi(selectedClassId);
                console.log('Fetched lessons data:', data);
                const list = Array.isArray(data) ? data : (data && Array.isArray((data as any).data) ? (data as any).data : []);
                setLessons(list);
                console.log('Loaded lessons for class:', selectedClassId, list);
            } catch (err) {
                console.error('Failed to fetch lessons', err);
                setLessons([]);
            } finally {
                setLoadingLessons(false);
            }
        })();
    }, [selectedClassId]);

    const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Class Timetable</h1>
                {isAdminOrSuper && (
                    <Button
                        label="Create Lesson"
                        icon="pi pi-plus"
                        onClick={() => setShowCreateDialog(true)}
                        className="p-button-success"
                    />
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>

                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <Dropdown
                            value={selectedClassId}
                            options={classOptions}
                            onChange={(e) => setSelectedClassId(e.value)}
                            optionLabel="label"
                            optionValue="value"
                            placeholder={loadingClasses ? 'Loading classes...' : 'Choose a class'}
                            className="w-full md:w-96"
                            filter
                            disabled={loadingClasses || classOptions.length === 0}
                        />
                    </div>

                    {loadingClasses && <div className="text-sm text-gray-500">Loading classes…</div>}
                </div>

                {(!loadingClasses && classOptions.length === 0) && (
                    <div className="text-sm text-yellow-600 mt-2">No classes available — check server response or permissions.</div>
                )}
            </div>

            {loadingLessons ? (
                <div className="flex justify-center py-10">
                    <i className="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
                </div>
            ) : selectedClassId ? (
                <LessonsTable lessons={lessons} />
            ) : (
                <div className="text-center py-10 text-gray-500">Please select a class to view the timetable.</div>
            )}

            <NewLesson
                visible={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                onSuccess={(newLesson: Lesson) => {
                    if ((newLesson as any)?.class?.id === selectedClassId) {
                        setLessons((prev) => [...prev, newLesson]);
                    }
                    setShowCreateDialog(false);
                }}
                selectedClassId={selectedClassId ?? undefined}
            />
        </div>
    );
}
