import { z } from 'zod';
import { UserSex, Roles, Terms, TestStatus, TermStatus, PaymentStatus, TraitCategory, PromotionStatus, Day, NewsCategory, NewsStatus, GalleryCategory, NotificationType } from '@/generated/prisma';
import { tr } from '@faker-js/faker';

// Common schemas
export const idSchema = z.string().cuid();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(10).max(15);
export const passwordSchema = z.string().min(6);

// Administration Schema
export const administrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema.optional(),
    username: z.string().optional(),
    avatar: z.string().optional(),
    role: z.nativeEnum(Roles),
    active: z.boolean().default(true)
});
export type AdministrationSchema = z.infer<typeof administrationSchema>;
export const administrationUpdateSchema = administrationSchema.partial();

// Student Schema
export const studentSchema = z.object({
    admissionnumber: z.string().optional(),
    firstname: z.string().min(1, { message: "First name is required!" }),
    surname: z.string().min(1, { message: "Surname is required!" }),
    othername: z.string().optional(),
    birthday: z.string().datetime().or(z.date()),
    gender: z.nativeEnum(UserSex),
    religion: z.string().optional(),
    house: z.string().min(1, { message: "House is required!" }),
    bloodgroup: z.string().min(1, { message: "Blood group is required!" }),
    admissiondate: z.string().datetime().or(z.date()).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string().min(1, { message: "Address is required!" }),
    state: z.string().min(1, { message: "State is required!" }),
    lga: z.string().min(1, { message: "LGA is required!" }),
    avarta: z.string().optional(),
    password: passwordSchema.optional(),
    parentid: z.string().min(1, { message: "Parent is required!" }),
    classid: z.string().min(1, { message: "Class is required!" }),
    active: z.boolean().default(true),
    section: z.string().optional()
});
export type StudentSchema = z.infer<typeof studentSchema>;
export const studentUpdateSchema = studentSchema.partial();

// Teacher Schema
export const teacherSchema = z.object({
    title: z.string().min(1, { message: "Title is required!" }),
    firstname: z.string().min(1, { message: "First name is required!" }),
    surname: z.string().min(1, { message: "Surname is required!" }),
    othername: z.string().optional(),
    birthday: z.string().datetime().or(z.date()).optional(),
    bloodgroup: z.string().optional(),
    gender: z.nativeEnum(UserSex),
    qualification: z.string().optional(),
    state: z.string().min(1, { message: "State is required!" }),
    lga: z.string().min(1, { message: "LGA is required!" }),
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: z.string().min(1),
    avarta: z.string().optional(),
    password: passwordSchema.optional(),
    active: z.boolean().default(true)
});
export type TeacherSchema = z.infer<typeof teacherSchema>;
export const teacherUpdateSchema = teacherSchema.partial();

// Parent Schema
export const parentSchema = z.object({
    title: z.string().min(1),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: z.string().datetime().or(z.date()).optional(),
    bloodgroup: z.string().optional(),
    gender: z.nativeEnum(UserSex),
    occupation: z.string().min(1),
    religion: z.string().min(1, { message: "Religion is required!" }),
    state: z.string().min(1, { message: "State is required!" }),
    lga: z.string().min(1, { message: "LGA is required!" }),
    email: emailSchema,
    phone: phoneSchema,
    avarta: z.string().optional(),
    address: z.string().min(1, { message: "Address is required!" }),
    password: passwordSchema.optional(),
    active: z.boolean().default(true)
});
export type ParentSchema = z.infer<typeof parentSchema>;
export const parentUpdateSchema = parentSchema.partial();

// Subject Schema
export const subjectSchema = z.object({
    name: z.string().min(1, { message: "Subject name is required" }),
    category: z.string().min(1, { message: "Category is required" }),
    teacherIds: z.array(z.string().min(1, { message: "Teacher ID must be a non-empty string" })).optional(),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;
export const subjectUpdateSchema = subjectSchema.partial();

// Class Schema
export const classSchema = z.object({
    name: z.string().min(1),
    category: z.string().optional(),
    capacity: z.number().int().optional(),
    formmasterid: z.string().min(1)
});
export type ClassSchema = z.infer<typeof classSchema>;
export const classUpdateSchema = classSchema.partial();

// Grading Policy Schema
export const gradingPolicySchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    passMark: z.number().int().positive().min(0, 'Pass mark must be positive'),
    maxScore: z.number().int().positive().min(1, 'Max score must be positive'),
    assessments: z.array(
        z.object({
            name: z.string().min(1, 'Assessment name is required'),
            weight: z.number().positive().min(0, 'Weight must be positive'),
            maxScore: z.number().int().positive().min(1, 'Assessment max score must be positive'),
        })
    ).min(1, 'At least one assessment is required'),
    traits: z.array(
        z.object({
            name: z.string().min(1, 'Trait name is required'),
            category: z.nativeEnum(TraitCategory, { message: 'Invalid trait category' }),
        })
    ).min(1, 'At least one trait is required'),
});

export const gradingPolicyUpdateSchema = gradingPolicySchema.partial().extend({
    assessments: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().min(1, 'Assessment name is required'),
            weight: z.number().positive().min(0, 'Weight must be positive'),
            maxScore: z.number().int().positive().min(1, 'Assessment max score must be positive'),
        })
    ).optional(),
    traits: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().min(1, 'Trait name is required'),
            category: z.nativeEnum(TraitCategory, { message: 'Invalid trait category' }),
        })
    ).optional(),
    deleteAssessments: z.array(z.string()).optional(),
    deleteTraits: z.array(z.string()).optional(),
});

export type GradingPolicySchema = z.infer<typeof gradingPolicySchema>;
export type GradingPolicyUpdateSchema = z.infer<typeof gradingPolicyUpdateSchema>;

export const gradingSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    session: z.string().min(1, 'Session is required'),
    term: z.nativeEnum(Terms, { message: 'Invalid term' }),
    published: z.boolean().default(false),
    gradingPolicyId: z.string().min(1, 'Grading policy is required'),
});

export const gradingUpdateSchema = gradingSchema.partial();

export type GradingSchema = z.infer<typeof gradingSchema>;
export type GradingUpdateSchema = z.infer<typeof gradingUpdateSchema>;

// Payment Setup Schema
export const paymentSetupSchema = z.object({
    amount: z.number().int().positive(),
    baseFees: z.number().int().positive(),
    partpayment: z.boolean().default(true),
    session: z.string().min(1),
    term: z.string().min(1),
    level: z.string().min(1)
});
export type PaymentSetupSchema = z.infer<typeof paymentSetupSchema>;
export const paymentSetupUpdateSchema = paymentSetupSchema.partial();

// Payment Schema
export const paymentSchema = z.object({
    session: z.string().min(1),
    term: z.nativeEnum(Terms),
    amount: z.number().int().positive(),
    status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
    studentid: idSchema
});
export type PaymentSchema = z.infer<typeof paymentSchema>;
export const paymentUpdateSchema = paymentSchema.partial();

// Term Schema
export const termSchema = z.object({
    start: z.string().datetime().or(z.date()),
    end: z.string().datetime().or(z.date()),
    nextterm: z.string().datetime().or(z.date()),
    daysopen: z.number().optional(),
    session: z.string().min(1),
    term: z.nativeEnum(Terms),
    status: z.nativeEnum(TermStatus).optional()
});
export type TermSchema = z.infer<typeof termSchema>;
export const termUpdateSchema = termSchema.partial();

// Lesson Schema
export const lessonSchema = z.object({
    name: z.string().min(1),
    day: z.nativeEnum(Day),
    startTime: z.string().datetime().or(z.date()),
    endTime: z.string().datetime().or(z.date()),
    subjectid: idSchema,
    classid: idSchema,
    teacherid: idSchema
});
export type LessonSchema = z.infer<typeof lessonSchema>;
export const lessonUpdateSchema = lessonSchema.partial();

// Assignment Schema
export const assignmentSchema = z.object({
    title: z.string().min(1),
    text: z.string().min(1),
    file: z.string().min(1),
    duedate: z.string().datetime().or(z.date()),
    graded: z.boolean().default(false),
    subjectid: idSchema,
    teacherid: idSchema,
    classid: idSchema
});
export type AssignmentSchema = z.infer<typeof assignmentSchema>;
export const assignmentUpdateSchema = assignmentSchema.partial();

// Test Schema
export const testSchema = z.object({
    title: z.string().min(1),
    status: z.nativeEnum(TestStatus),
    instructions: z.string().min(1),
    duration: z.number().int().positive(),
    maxscore: z.number().int().positive(),
    open: z.boolean().default(false),
    testdate: z.string().datetime().or(z.date()),
    testtime: z.string().datetime().or(z.date()),
    term: z.string().min(1),
    subjectid: idSchema,
    teacherid: idSchema,
    classid: idSchema
});
export type TestSchema = z.infer<typeof testSchema>;
export const testUpdateSchema = testSchema.partial();

// Question Schema
export const questionSchema = z.object({
    text: z.string().min(1),
    options: z.record(z.any(), z.any()),
    answer: z.string().min(1),
    testid: idSchema
});
export type QuestionSchema = z.infer<typeof questionSchema>;
export const questionUpdateSchema = questionSchema.partial();

// News Schema
export const newsSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    author: z.string().min(1),
    category: z.nativeEnum(NewsCategory),
    status: z.nativeEnum(NewsStatus).default(NewsStatus.DRAFT),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    readTime: z.number().int().positive().optional(),
    publishedAt: z.string().datetime().or(z.date()).optional()
});
export type NewsSchema = z.infer<typeof newsSchema>;
export const newsUpdateSchema = newsSchema.partial();

// Gallery Schema
export const gallerySchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url(),
    category: z.nativeEnum(GalleryCategory),
    isActive: z.boolean().default(true),
    order: z.number().int().optional()
});
export type GallerySchema = z.infer<typeof gallerySchema>;
export const galleryUpdateSchema = gallerySchema.partial();

// Notification Schema
export const notificationSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.nativeEnum(NotificationType),
    broadcast: z.boolean().default(false),
    isRead: z.boolean().default(false),
    studentId: idSchema.optional(),
    teacherId: idSchema.optional(),
    parentId: idSchema.optional(),
    adminId: idSchema.optional()
});
export type NotificationSchema = z.infer<typeof notificationSchema>;
export const notificationUpdateSchema = notificationSchema.partial();

// Event Schema
export const eventSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    startTime: z.string().datetime().or(z.date()),
    endTime: z.string().datetime().or(z.date()),
    classId: idSchema.optional()
});
export type EventSchema = z.infer<typeof eventSchema>;
export const eventUpdateSchema = eventSchema.partial();

// Announcement Schema
export const announcementSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.string().datetime().or(z.date()),
    classId: idSchema.optional()
});
export type AnnouncementSchema = z.infer<typeof announcementSchema>;
export const announcementUpdateSchema = announcementSchema.partial();

// Attendance Schema
export const attendanceSchema = z.object({
    present: z.boolean().default(false),
    date: z.string().datetime().or(z.date()),
    studentId: idSchema,
    lessonId: z.number().int()
});
export type AttendanceSchema = z.infer<typeof attendanceSchema>;
export const attendanceUpdateSchema = attendanceSchema.partial();

// Assessment Schema
export const assessmentSchema = z.object({
    name: z.string().min(1),
    weight: z.number().positive(),
    maxScore: z.number().int().positive(),
    gradingPolicyId: idSchema
});
export type AssessmentSchema = z.infer<typeof assessmentSchema>;
export const assessmentUpdateSchema = assessmentSchema.partial();

// Report Card Schema
export const reportCardSchema = z.object({
    studentId: idSchema,
    classId: idSchema,
    session: z.string().min(1),
    term: z.nativeEnum(Terms),
    totalScore: z.number().optional(),
    averageScore: z.number().optional(),
    classPosition: z.number().int().positive().optional(),
    remark: z.string().optional()
});
export type ReportCardSchema = z.infer<typeof reportCardSchema>;
export const reportCardUpdateSchema = reportCardSchema.partial();