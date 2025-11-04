'use client';

import { Lesson } from '@/types';
import { format } from 'date-fns';

interface LessonsTableProps {
    lessons: Lesson[];
}

/**
 * Column time slots (as minutes since midnight)
 * Note: times are local-time based using Date getHours/getMinutes on lesson timestamps.
 */
const TIME_SLOTS = [
    { label: '08:00 - 08:40', startMin: 8 * 60, endMin: 8 * 60 + 40 },
    { label: '08:40 - 09:20', startMin: 8 * 60 + 40, endMin: 9 * 60 + 20 },
    { label: '09:20 - 10:00', startMin: 9 * 60 + 20, endMin: 10 * 60 },
    { label: '10:00 - 10:40', startMin: 10 * 60, endMin: 10 * 60 + 40 }, // Long break
    { label: '10:40 - 11:20', startMin: 10 * 60 + 40, endMin: 11 * 60 + 20 },
    { label: '11:40 - 12:00', startMin: 11 * 60 + 40, endMin: 12 * 60 }, // small slot
    { label: '12:00 - 12:40', startMin: 12 * 60, endMin: 12 * 60 + 40 }, // contains short-break 12:00-12:10
    { label: '12:40 - 13:20', startMin: 12 * 60 + 40, endMin: 13 * 60 + 20 },
    { label: '13:20 - 14:00', startMin: 13 * 60 + 20, endMin: 14 * 60 },
];

// Display weekdays (rows)
const DAYS = [
    { label: 'Monday', enum: 'MONDAY' },
    { label: 'Tuesday', enum: 'TUESDAY' },
    { label: 'Wednesday', enum: 'WEDNESDAY' },
    { label: 'Thursday', enum: 'THURSDAY' },
    { label: 'Friday', enum: 'FRIDAY' },
];

function toMinutesSinceMidnight(dt: Date) {
    return dt.getHours() * 60 + dt.getMinutes();
}

/**
 * Returns the first lesson that overlaps the given slot for the given day.
 * Overlap rule: lesson.start < slotEnd && lesson.end > slotStart
 */
function findLessonForSlot(lessons: Lesson[], dayEnum: string, slotStart: number, slotEnd: number): Lesson | null {
    for (const lesson of lessons) {
        if (lesson.day !== dayEnum) continue;
        try {
            const s = new Date(lesson.startTime);
            const e = new Date(lesson.endTime);
            const lessonStart = toMinutesSinceMidnight(s);
            const lessonEnd = toMinutesSinceMidnight(e);

            if (lessonStart < slotEnd && lessonEnd > slotStart) {
                return lesson;
            }
        } catch (err) {
            // ignore malformed lesson date
        }
    }
    return null;
}

export default function LessonsTable({ lessons }: LessonsTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
            <table className="min-w-full bg-white table-fixed">
                <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <th className="px-4 py-3 text-left font-semibold w-40">Day / Time</th>
                        {TIME_SLOTS.map((slot) => (
                            <th key={slot.label} className="px-2 py-3 text-center font-semibold text-sm">
                                {slot.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {DAYS.map((day) => (
                        <tr key={day.enum} className="border-b bg-gray-50 align-top">
                            <td className="px-4 py-3 font-medium text-gray-700">{day.label}</td>

                            {TIME_SLOTS.map((slot) => {
                                // Special breaks handling
                                const isLongBreak = slot.label === '10:00 - 10:40';
                                const isShortBreakSlot = slot.label === '12:00 - 12:40';

                                // If long break slot, show Long break note for all days
                                if (isLongBreak) {
                                    return (
                                        <td
                                            key={`${day.enum}-${slot.label}`}
                                            className="px-4 py-3 text-center align-top h-24 border-l border-gray-200"
                                        >
                                            <div className="text-xs text-red-600 font-semibold">Long Break</div>
                                        </td>
                                    );
                                }

                                // For normal slots (including the 12:00-12:40 which contains a short break)
                                const lesson = findLessonForSlot(lessons, day.enum, slot.startMin, slot.endMin);

                                // If short break slot, show short break indicator (still allow lesson display if present)
                                if (isShortBreakSlot) {
                                    // if there's a lesson overlapping the slot (rare), show it, but also indicate short break time
                                    return (
                                        <td
                                            key={`${day.enum}-${slot.label}`}
                                            className="px-4 py-3 text-center align-top h-24 border-l border-gray-200"
                                        >
                                            {lesson ? (
                                                <div className="text-xs space-y-1">
                                                    <div className="font-semibold text-blue-700">{lesson.subject?.name ?? 'Subject'}</div>
                                                    <div className="text-gray-600">
                                                        {lesson.teacher?.firstname ?? ''} {lesson.teacher?.surname ?? ''}
                                                    </div>
                                                    <div className="text-xs text-yellow-700">Short break 12:00 - 12:10</div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-yellow-700 font-medium">Short break 12:00 - 12:10</div>
                                            )}
                                        </td>
                                    );
                                }

                                // Regular slot rendering
                                return (
                                    <td
                                        key={`${day.enum}-${slot.label}`}
                                        className="px-4 py-3 text-center align-top h-24 border-l border-gray-200"
                                    >
                                        {lesson ? (
                                            <div className="text-xs space-y-1">
                                                <div className="font-semibold text-blue-700">{lesson.subject?.name ?? 'Subject'}</div>
                                                <div className="text-gray-600">
                                                    {lesson.teacher?.firstname ?? ''} {lesson.teacher?.surname ?? ''}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {(() => {
                                                        try {
                                                            const s = new Date(lesson.startTime);
                                                            const e = new Date(lesson.endTime);
                                                            return `${format(s, 'HH:mm')} - ${format(e, 'HH:mm')}`;
                                                        } catch {
                                                            return '';
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
