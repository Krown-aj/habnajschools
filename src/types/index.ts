export type Day =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';

export interface Teacher {
    id: string;
    firstname: string;
    surname: string;
    othername?: string;
}

export interface Class {
    id: string;
    name: string;
}

export interface Subject {
    id: string;
    name: string;
}

export interface Lesson {
    id: number;
    name: string;
    day: Day;
    startTime: string;
    endTime: string;
    teacher: Teacher;
    class: Class;
    subject: Subject;
    _count: { attendances: number };
}

export type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NewsCategory = 'GENERAL' | 'ACADEMIC' | 'SPORTS' | 'EVENT' | 'ANNOUNCEMENT' | 'OTHER' | 'HOLIDAY';

export interface News {
    id: string;
    title: string;
    content: string;
    excerpt?: string | null;
    author: string;
    category: NewsCategory;
    status: NewsStatus;
    featured: boolean;
    image?: string | null;
    readTime?: number | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt?: string;
}
