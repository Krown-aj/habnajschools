import { z } from 'zod'

// Common enums
export const UserSexSchema = z.enum(['MALE', 'FEMALE'])
export const RolesSchema = z.enum(['Admin', 'Super', 'Management'])
export const TermsSchema = z.enum(['First', 'Second', 'Third'])
export const DaySchema = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])
export const TestStatusSchema = z.enum(['Completed', 'Cancelled', 'Pending'])
export const PaymentStatusSchema = z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'])
export const NotificationTypeSchema = z.enum([
    'PAYMENT_DUE', 'PAYMENT_CONFIRMED', 'NEW_USER', 'NEW_EVENT',
    'NEW_ANNOUNCEMENT', 'ASSIGNMENT_DUE', 'TEST_SCHEDULED', 'GENERAL'
])

// Student validation schemas
export const CreateStudentSchema = z.object({
    admissionnumber: z.string().min(1),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: z.string().transform((str) => new Date(str)),
    gender: UserSexSchema,
    religion: z.string().optional(),
    house: z.string().min(1),
    bloodgroup: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().min(1),
    state: z.string().min(1),
    lga: z.string().min(1),
    avarta: z.string().optional(),
    password: z.string().optional(),
    parentid: z.string().min(1),
    classid: z.string().min(1)
})

export const UpdateStudentSchema = CreateStudentSchema.partial()

// Teacher validation schemas
export const CreateTeacherSchema = z.object({
    title: z.string().min(1),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: z.string().transform((str) => new Date(str)).optional(),
    bloodgroup: z.string().optional(),
    gender: UserSexSchema,
    state: z.string().min(1),
    lga: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().min(1),
    avarta: z.string().optional(),
    password: z.string().optional()
})

export const UpdateTeacherSchema = CreateTeacherSchema.partial()

// Class validation schemas
export const CreateClassSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    capacity: z.number().optional(),
    formmasterid: z.string().optional()
})

export const UpdateClassSchema = CreateClassSchema.partial()

// Subject validation schemas
export const CreateSubjectSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1)
})

export const UpdateSubjectSchema = CreateSubjectSchema.partial()

// Assignment validation schemas
export const CreateAssignmentSchema = z.object({
    title: z.string().min(1),
    text: z.string().min(1),
    file: z.string().min(1),
    duedate: z.string().transform((str) => new Date(str)),
    graded: z.boolean().default(false),
    subjectid: z.string().min(1),
    teacherid: z.string().min(1),
    classid: z.string().min(1)
})

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial()

// Test validation schemas
export const CreateTestSchema = z.object({
    title: z.string().min(1),
    status: TestStatusSchema.default('Pending'),
    instructions: z.string().min(1),
    duration: z.number().min(1),
    maxscore: z.number().min(1),
    open: z.boolean().default(false),
    testdate: z.string().transform((str) => new Date(str)),
    testtime: z.string().transform((str) => new Date(str)),
    term: z.string().min(1),
    subjectid: z.string().min(1),
    teacherid: z.string().min(1),
    classid: z.string().min(1)
})

export const UpdateTestSchema = CreateTestSchema.partial()

// Parent validation schemas
export const CreateParentSchema = z.object({
    title: z.string().min(1),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: z.string().transform((str) => new Date(str)).optional(),
    bloodgroup: z.string().optional(),
    gender: UserSexSchema,
    occupation: z.string().min(1),
    religion: z.string().min(1),
    state: z.string().min(1),
    lga: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    password: z.string().optional()
})

export const UpdateParentSchema = CreateParentSchema.partial()

// Payment validation schemas
export const CreatePaymentSchema = z.object({
    session: z.string().min(1),
    term: TermsSchema,
    amount: z.number().min(0),
    status: PaymentStatusSchema.default('PENDING'),
    studentid: z.string().min(1)
})

export const UpdatePaymentSchema = CreatePaymentSchema.partial()

// Multi-delete schema
export const MultiDeleteSchema = z.object({
    ids: z.array(z.string()).min(1),
    removeStudents: z.boolean().optional().default(false)
})