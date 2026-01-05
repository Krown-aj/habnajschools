import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const getLatestMonday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const latestMonday = today;
    latestMonday.setDate(today.getDate() - daysSinceMonday);
    return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
    lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
    const latestMonday = getLatestMonday();

    return lessons.map((lesson) => {
        const lessonDayOfWeek = lesson.start.getDay();

        const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

        const adjustedStartDate = new Date(latestMonday);

        adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
        adjustedStartDate.setHours(
            lesson.start.getHours(),
            lesson.start.getMinutes(),
            lesson.start.getSeconds()
        );
        const adjustedEndDate = new Date(adjustedStartDate);
        adjustedEndDate.setHours(
            lesson.end.getHours(),
            lesson.end.getMinutes(),
            lesson.end.getSeconds()
        );

        return {
            title: lesson.title,
            start: adjustedStartDate,
            end: adjustedEndDate,
        };
    });
};

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


// teacher remark generator
export const getTeacherRemark = (average: number | undefined | null) => {
    const avg = Number(average ?? 0);

    if (avg >= 70) return "Excellent work — keep pushing with extra challenges.";
    if (avg >= 60) return "Strong performance — refine weak areas to excel further.";
    if (avg >= 50) return "Good effort — continue steady revision and practice.";
    if (avg >= 45) return "Fair result — improve consistency and review weak topics.";
    if (avg >= 40) return "Needs improvement — focus on core concepts and revision.";
    return "Below expectation — seek support and follow a guided study plan.";
};

//base image retriever
export const getBase64ImageFromUrl = async (url?: string | null, place_holder?: string | null) => {
    const safeUrl = url && String(url).trim() ? url : place_holder;
    try {
        if (!safeUrl) return null;
        const res = await fetch(safeUrl);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

// convert to ordinal (1 -> 1st, 2 -> 2nd, etc)
export const toOrdinal = (value: any) => {
    const n = Number(String(value).replace(/[^0-9]/g, ""));
    if (!Number.isFinite(n) || n <= 0) return String(value ?? "");
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// parse ordinal
export const parseOrdinal = (pos?: string | null) => {
    if (!pos) return Number.MAX_SAFE_INTEGER;
    const m = String(pos).match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
    const n = Number(pos);
    return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};