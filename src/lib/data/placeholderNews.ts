import type { News } from '@/types';
import { images } from "@/constants";

export const PLACEHOLDER_NEWS: News[] = [
    {
        id: 'placeholder22',
        title: 'Important Announcement on School Resumption and Upcoming Examinations',
        excerpt: `
            Dear Parents and Guardians,
            We are pleased to inform you that the Bauchi State Government has approved the resumption of all Basic/Senior Secondary Schools and Tertiary Institutions from Sunday, 4th January 2026.
        `,
        content: `
            Dear Parents and Guardians,
            We are pleased to inform you that the Bauchi State Government has approved the resumption of all Basic/Senior Secondary Schools and Tertiary Institutions from Sunday, 4th January 2026.
            In line with this directive, all examinations that were scheduled before the closure will now hold within the first week of resumption. Please ensure your child/ward is fully prepared and returns to school on time.
            Additionally, we kindly remind all parents/guardians who are yet to complete their children's school fees payment to do so as soon as possible to avoid any disruptions to their participation in academic activities, including examinations.
            Thank you for your continued cooperation and support.
            Best regards,
            School Management
        `,
        author: 'Musa Zakariyya',
        category: 'EVENT',
        status: 'PUBLISHED',
        featured: true,
        image: (images as any).jss2,
        readTime: 3,
        publishedAt: '2026-01-05T09:00:00.000Z',
        createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
        id: 'placeholder',
        title: 'Career Guidance and Counselling Day',
        excerpt: `All Teachers, Parents, and Students, This is to inform all teachers, parents, and students that the school will be hosting a Career Guidance and Counselling Day on Wednesday, 19th November 2025.`,
        content: `All Teachers, Parents, and Students, This is to inform all teachers, parents, and students that the school will be hosting a Career Guidance and Counselling Day on Wednesday, 19th November 2025.
        The purpose of this event is to help students explore various career options, understand their interests and strengths, and receive professional advice on educational and career planning.
        All students are expected to attend in full school uniform. Teachers are requested to guide and assist during the sessions.
        Venue: School Premises 
        Time:  9:00am – 1:00pm
        Your cooperation and participation will be highly appreciated.
        Signed,
        Principal 
        Habnaj International Schools`,
        author: 'Musa Zakariyya',
        category: 'EVENT',
        status: 'PUBLISHED',
        featured: true,
        image: (images as any).jss2,
        readTime: 3,
        publishedAt: '2025-11-13T09:00:00.000Z',
        createdAt: '2025-11-13T00:00:00.000Z',
    },
    {
        id: 'placeholder-1',
        title: 'First Term 2025/2026 Mid-Term Break',
        excerpt: ' Dear parents/guardians, you are hereby notified that there will be a mid-term break for this term which will take place from Friday 31 October, 2025 to Monday 03, November...',
        content: ' Dear parents/guardians, you are hereby notified that there will be a mid-term break for this term which will take place from Friday 31 October, 2025 to Monday 03, November. You are to take note and make sure your wards do all their home works/assignments. Happy mid-term break to you! From all of us at Habnaj',
        author: 'Musa Zakariyya',
        category: 'EVENT',
        status: 'PUBLISHED',
        featured: true,
        image: (images as any).computerroom2,
        readTime: 3,
        publishedAt: '2025-03-15T09:00:00.000Z',
        createdAt: '2025-03-01T00:00:00.000Z',
    },
    {
        id: 'placeholder-2',
        title: 'Annual Mathematics Day 2025',
        excerpt: 'Join us for our Annual Mathematics Day, where students from the Mathematics Club will compete in exciting quiz competitions...',
        content: '',
        author: 'Mathematics Club',
        category: 'EVENT',
        status: 'PUBLISHED',
        featured: true,
        image: (images as any).jss2,
        readTime: 3,
        publishedAt: '2025-03-15T09:00:00.000Z',
        createdAt: '2025-03-01T00:00:00.000Z',
    },
    {
        id: 'placeholder-3',
        title: 'New Computer Room Opening',
        excerpt: 'We are thrilled to announce the opening of our state-of-the-art computer room, equipped with modern computers...',
        content: '',
        author: 'ICT Department',
        category: 'ANNOUNCEMENT',
        status: 'PUBLISHED',
        featured: false,
        image: (images as any).computerroom2,
        readTime: 2,
        publishedAt: '2025-09-10T10:00:00.000Z',
        createdAt: '2025-09-01T00:00:00.000Z',
    },
    {
        id: 'placeholder-4',
        title: 'Sanitation Club Clean-Up Drive',
        excerpt: 'The Sanitation Club is organizing a school-wide clean-up to promote environmental awareness...',
        content: '',
        author: 'Sanitation Club',
        category: 'OTHER',
        status: 'PUBLISHED',
        featured: false,
        image: (images as any).student8,
        readTime: 2,
        publishedAt: '2025-10-05T08:00:00.000Z',
        createdAt: '2025-10-01T00:00:00.000Z',
    },
    {
        id: 'placeholder-5',
        title: 'Science Day Exhibition 2025',
        excerpt: 'Our Science and Technology Club will host the annual Science Day, featuring student-led experiments...',
        content: '',
        author: 'Science Club',
        category: 'EVENT',
        status: 'PUBLISHED',
        featured: true,
        image: (images as any).jss,
        readTime: 4,
        publishedAt: '2025-11-12T09:00:00.000Z',
        createdAt: '2025-11-01T00:00:00.000Z',
    },
];