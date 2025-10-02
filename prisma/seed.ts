import { PrismaClient, Roles, UserSex, Day, TermStatus, Terms, PaymentStatus, TestStatus, NotificationType, NewsCategory, NewsStatus, GalleryCategory, TraitCategory, PromotionStatus } from '../src/generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Generate a new admission number for a student.
 */
const generateAdmissionNumber = (
    existingAdmissions: string[] = [],
    currentDate = new Date(),
    prefix = "HAB"
) => {
    const yearStr = currentDate.getFullYear().toString();
    const safePrefix = prefix || "";
    const escapedPrefix = safePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escapedPrefix}/${yearStr}/(\\d{5})$`);
    const sequences = existingAdmissions.reduce((acc: number[], admission: string) => {
        const match = admission.match(regex);
        if (match) acc.push(parseInt(match[1], 10));
        return acc;
    }, []);
    const baseSequence = 1;
    const nextSequence = sequences.length === 0 ? baseSequence : Math.max(...sequences) + 1;
    const paddedSequence = nextSequence.toString().padStart(5, "0");
    return `${safePrefix}/${yearStr}/${paddedSequence}`;
};

async function seed() {
    try {
        // Clear existing data in reverse order of dependencies
        await prisma.notification.deleteMany();
        await prisma.studentTrait.deleteMany();
        await prisma.studentAssessment.deleteMany();
        await prisma.studentGrade.deleteMany();
        await prisma.reportCard.deleteMany();
        await prisma.trait.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.grading.deleteMany();
        await prisma.gradingPolicy.deleteMany();
        await prisma.answer.deleteMany();
        await prisma.question.deleteMany();
        await prisma.submission.deleteMany();
        await prisma.test.deleteMany();
        await prisma.assignment.deleteMany();
        await prisma.attendance.deleteMany();
        await prisma.lesson.deleteMany();
        await prisma.studentPromotion.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.paymentSetup.deleteMany();
        await prisma.announcement.deleteMany();
        await prisma.event.deleteMany();
        await prisma.term.deleteMany();
        await prisma.subject.deleteMany();
        await prisma.class.deleteMany();
        await prisma.student.deleteMany();
        await prisma.teacher.deleteMany();
        await prisma.parent.deleteMany();
        await prisma.administration.deleteMany();
        await prisma.news.deleteMany();
        await prisma.gallery.deleteMany();

        // Seed Administrations
        const admins = await Promise.all([
            prisma.administration.create({
                data: {
                    id: faker.string.uuid(),
                    email: 'super@habnaj.com',
                    username: faker.internet.userName(),
                    password: await bcrypt.hash('password', 12),
                    role: Roles.Super,
                    active: true,
                },
            }),
            prisma.administration.create({
                data: {
                    id: faker.string.uuid(),
                    email: 'admin@habnaj.com',
                    username: faker.internet.userName(),
                    password: await bcrypt.hash('password', 12),
                    role: Roles.Admin,
                    active: true,
                },
            }),
        ]);

        // Seed Parents
        const parents = await Promise.all(
            Array.from({ length: 5 }).map(async () =>
                prisma.parent.create({
                    data: {
                        id: faker.string.uuid(),
                        title: faker.helpers.arrayElement(['Mr.', 'Mrs.', 'Miss']),
                        firstname: faker.person.firstName(),
                        surname: faker.person.lastName(),
                        othername: faker.person.middleName(),
                        birthday: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
                        bloodgroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+']),
                        gender: faker.helpers.arrayElement([UserSex.MALE, UserSex.FEMALE]),
                        occupation: faker.person.jobTitle(),
                        religion: faker.helpers.arrayElement(['Christianity', 'Islam', 'Other']),
                        state: faker.location.state(),
                        lga: faker.location.city(),
                        email: faker.internet.email(),
                        phone: faker.phone.number(),
                        address: faker.location.streetAddress(),
                        password: await bcrypt.hash('password', 12),
                        active: true,
                    },
                })
            )
        );

        // Seed Teachers
        const teachers = await Promise.all(
            Array.from({ length: 5 }).map(async () =>
                prisma.teacher.create({
                    data: {
                        id: faker.string.uuid(),
                        title: faker.helpers.arrayElement(['Mr.', 'Mrs.', 'Ms.', 'Dr.']),
                        firstname: faker.person.firstName(),
                        surname: faker.person.lastName(),
                        othername: faker.person.middleName(),
                        birthday: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
                        bloodgroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+']),
                        gender: faker.helpers.arrayElement([UserSex.MALE, UserSex.FEMALE]),
                        qualification: faker.helpers.arrayElement(['BSc', 'MSc', 'PhD', 'HND']),
                        state: faker.location.state(),
                        lga: faker.location.city(),
                        email: faker.internet.email(),
                        phone: faker.phone.number(),
                        address: faker.location.streetAddress(),
                        avarta: faker.image.avatar(),
                        password: await bcrypt.hash('password', 12),
                        active: true,
                    },
                })
            )
        );

        // Seed Classes
        const classes = await Promise.all(
            Array.from({ length: 3 }).map((_, i) =>
                prisma.class.create({
                    data: {
                        id: faker.string.uuid(),
                        name: `Class ${i + 1}`,
                        category: faker.helpers.arrayElement(['Silver', 'Bronze', 'Diamond', 'Platinum', 'Gold']),
                        capacity: 30,
                        formmasterid: teachers[i % teachers.length].id,
                    },
                })
            )
        );

        // Seed Subjects
        const subjects = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.subject.create({
                    data: {
                        id: faker.string.uuid(),
                        name: faker.helpers.arrayElement(['Mathematics', 'English', 'Science', 'History', 'Geography']),
                        category: faker.helpers.arrayElement(['General', 'Nursery', 'Primary', 'JSS', 'SSS']),
                        teachers: {
                            connect: { id: teachers[i % teachers.length].id },
                        },
                    },
                })
            )
        );

        // Seed Terms
        const terms = await Promise.all(
            Array.from({ length: 3 }).map((_, i) =>
                prisma.term.create({
                    data: {
                        id: faker.string.uuid(),
                        session: `2025/2026`,
                        term: [Terms.First, Terms.Second, Terms.Third][i],
                        start: new Date(`2025-0${i * 3 + 1}-01`),
                        end: new Date(`2025-0${i * 3 + 3}-30`),
                        nextterm: i < 2 ? new Date(`2025-0${(i + 1) * 3 + 1}-01`) : new Date(`2026-01-01`),
                        daysopen: 60,
                        status: i === 0 ? TermStatus.Active : TermStatus.Inactive,
                    },
                })
            )
        );

        // Seed Students
        const existingAdmissions: string[] = [];
        const students = await Promise.all(
            Array.from({ length: 10 }).map(async () => {
                const admissionNumber = generateAdmissionNumber(existingAdmissions, new Date(), 'HAB');
                existingAdmissions.push(admissionNumber);
                return prisma.student.create({
                    data: {
                        id: faker.string.uuid(),
                        admissionnumber: admissionNumber,
                        firstname: faker.person.firstName(),
                        surname: faker.person.lastName(),
                        othername: faker.person.middleName(),
                        birthday: faker.date.birthdate({ min: 6, max: 18, mode: 'age' }),
                        gender: faker.helpers.arrayElement([UserSex.MALE, UserSex.FEMALE]),
                        religion: faker.helpers.arrayElement(['Christianity', 'Islam', 'Other']),
                        house: faker.helpers.arrayElement(['Red House', 'Blue House', 'Green House']),
                        bloodgroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+']),
                        admissiondate: new Date('2025-01-01'),
                        email: faker.internet.email(),
                        phone: faker.phone.number(),
                        address: faker.location.streetAddress(),
                        state: faker.location.state(),
                        lga: faker.location.city(),
                        avarta: faker.image.avatar(),
                        password: await bcrypt.hash('password', 12),
                        active: true,
                        parentid: parents[faker.number.int({ min: 0, max: parents.length - 1 })].id,
                        classid: classes[faker.number.int({ min: 0, max: classes.length - 1 })].id,
                    },
                });
            })
        );

        // Seed Grading Policies
        const gradingPolicies = await Promise.all(
            Array.from({ length: 3 }).map((_, i) =>
                prisma.gradingPolicy.create({
                    data: {
                        id: faker.string.uuid(),
                        title: `Grading Policy ${i + 1}`,
                        description: faker.lorem.sentence(),
                        passMark: 50,
                        maxScore: 100,
                    },
                })
            )
        );

        // Seed Traits
        const traits = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.trait.create({
                    data: {
                        id: faker.string.uuid(),
                        name: faker.helpers.arrayElement(['Punctuality', 'Teamwork', 'Creativity', 'Discipline', 'Leadership']),
                        category: faker.helpers.arrayElement([
                            TraitCategory.AFFECTIVE,
                            TraitCategory.PSYCHOMOTOR,
                            TraitCategory.BEHAVIOURAL,
                            TraitCategory.COGNITIVE,
                        ]),
                        gradingpolicyId: gradingPolicies[i % gradingPolicies.length].id,
                    },
                })
            )
        );

        // Seed Gradings
        const gradings = await Promise.all(
            Array.from({ length: 3 }).map((_, i) =>
                prisma.grading.create({
                    data: {
                        id: faker.string.uuid(),
                        title: `Grading ${i + 1}`,
                        session: `2025/2026`,
                        term: [Terms.First, Terms.Second, Terms.Third][i],
                        published: faker.datatype.boolean(),
                        gradingPolicyId: gradingPolicies[i % gradingPolicies.length].id,
                    },
                })
            )
        );

        // Seed Assessments
        const assessments = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.assessment.create({
                    data: {
                        id: faker.string.uuid(),
                        name: `Assessment ${i + 1}`,
                        weight: faker.number.float({ min: 0.1, max: 0.5, fractionDigits: 2 }),
                        maxScore: 100,
                        gradingPolicyId: gradingPolicies[i % gradingPolicies.length].id,
                    },
                })
            )
        );

        // Seed Lessons
        const lessons = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.lesson.create({
                    data: {
                        id: faker.number.int({ min: 1, max: 1000 }),
                        name: `${subjects[i % subjects.length].name} Lesson`,
                        day: faker.helpers.arrayElement([Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY]),
                        startTime: new Date(`2025-01-01T${faker.number.int({ min: 8, max: 14 })}:00:00`),
                        endTime: new Date(`2025-01-01T${faker.number.int({ min: 9, max: 15 })}:00:00`),
                        subjectid: subjects[i % subjects.length].id,
                        classid: classes[i % classes.length].id,
                        teacherid: teachers[i % teachers.length].id,
                    },
                })
            )
        );

        // Seed Attendances
        const attendances = await Promise.all(
            Array.from({ length: 20 }).map((_, i) =>
                prisma.attendance.create({
                    data: {
                        id: faker.number.int({ min: 1, max: 1000 }),
                        date: faker.date.recent({ days: 7 }),
                        present: faker.datatype.boolean(),
                        studentId: students[i % students.length].id,
                        lessonId: lessons[i % lessons.length].id,
                    },
                })
            )
        );

        // Seed Events
        const events = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.event.create({
                    data: {
                        id: faker.number.int({ min: 1, max: 1000 }),
                        title: faker.lorem.words(3),
                        description: faker.lorem.sentence(),
                        startTime: faker.date.soon({ days: 30 }),
                        endTime: faker.date.soon({ days: 30, refDate: new Date() }),
                        classId: classes[i % classes.length].id,
                    },
                })
            )
        );

        // Seed Announcements
        const announcements = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.announcement.create({
                    data: {
                        id: faker.number.int({ min: 1, max: 1000 }),
                        title: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        date: faker.date.recent({ days: 7 }),
                        classId: classes[i % classes.length].id,
                    },
                })
            )
        );

        // Seed PaymentSetups
        const paymentSetups = await Promise.all(
            Array.from({ length: 3 }).map((_, i) =>
                prisma.paymentSetup.create({
                    data: {
                        id: faker.string.uuid(),
                        amount: faker.number.int({ min: 10000, max: 50000 }),
                        baseFees: faker.number.int({ min: 8000, max: 40000 }),
                        partpayment: faker.datatype.boolean(),
                        session: `2025/2026`,
                        term: [Terms.First, Terms.Second, Terms.Third][i],
                        level: faker.helpers.arrayElement(['Primary', 'Secondary']),
                    },
                })
            )
        );

        // Seed Payments
        const payments = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.payment.create({
                    data: {
                        id: faker.string.uuid(),
                        session: `2025/2026`,
                        term: faker.helpers.arrayElement([Terms.First, Terms.Second, Terms.Third]),
                        amount: faker.number.int({ min: 5000, max: 30000 }),
                        status: faker.helpers.arrayElement([PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.PAID, PaymentStatus.OVERDUE]),
                        studentid: students[i % students.length].id,
                    },
                })
            )
        );

        // Seed ReportCards
        const reportCards = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.reportCard.create({
                    data: {
                        id: faker.string.uuid(),
                        studentId: students[i % students.length].id,
                        classId: classes[i % classes.length].id,
                        gradingId: gradings[i % gradings.length].id,
                        totalScore: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
                        averageScore: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
                        classPosition: `${faker.number.int({ min: 1, max: 10 })}${faker.helpers.arrayElement(['st', 'nd', 'rd', 'th'])}`,
                        remark: faker.lorem.sentence(),
                        formmasterRemark: faker.lorem.sentence(),
                    },
                })
            )
        );

        // Seed StudentAssessments
        const studentAssessments = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.studentAssessment.create({
                    data: {
                        id: faker.string.uuid(),
                        studentId: students[i % students.length].id,
                        assessmentId: assessments[i % assessments.length].id,
                        subjectId: subjects[i % subjects.length].id,
                        classId: classes[i % classes.length].id,
                        gradingId: gradings[i % gradings.length].id,
                        score: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
                    },
                })
            )
        );

        // Seed StudentGrades
        const studentGrades = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.studentGrade.create({
                    data: {
                        id: faker.string.uuid(),
                        studentId: students[i % students.length].id,
                        classId: classes[i % classes.length].id,
                        subjectId: subjects[i % subjects.length].id,
                        gradingId: gradings[i % gradings.length].id,
                        score: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
                        grade: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'F']),
                        remark: faker.lorem.sentence(),
                        subjectPosition: `${faker.number.int({ min: 1, max: 10 })}${faker.helpers.arrayElement(['st', 'nd', 'rd', 'th'])}`,
                        assessments: {
                            connect: assessments.slice(0, 2).map(a => ({ id: a.id })), // Connect 2 assessments
                        },
                    },
                })
            )
        );

        // Seed StudentTraits
        const studentTraits = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.studentTrait.create({
                    data: {
                        id: faker.string.uuid(),
                        studentId: students[i % students.length].id,
                        traitId: traits[i % traits.length].id,
                        gradingId: gradings[i % gradings.length].id,
                        score: faker.number.int({ min: 1, max: 5 }),
                        remark: faker.lorem.sentence(),
                    },
                })
            )
        );

        // Seed StudentPromotions
        const studentPromotions = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.studentPromotion.create({
                    data: {
                        id: faker.string.uuid(),
                        studentId: students[i % students.length].id,
                        fromClassId: classes[i % classes.length].id,
                        toClassId: classes[(i + 1) % classes.length].id,
                        session: `2025/2026`,
                        status: faker.helpers.arrayElement([PromotionStatus.PROMOTED, PromotionStatus.REPEATED, PromotionStatus.GRADUATED, PromotionStatus.WITHDRAWN]),
                        remark: faker.lorem.sentence(),
                    },
                })
            )
        );

        // Seed Assignments
        const assignments = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.assignment.create({
                    data: {
                        id: faker.string.uuid(),
                        title: `Assignment ${i + 1}`,
                        text: faker.lorem.paragraph(),
                        file: faker.image.url(),
                        duedate: faker.date.soon({ days: 30 }),
                        graded: faker.datatype.boolean(),
                        subjectid: subjects[i % subjects.length].id,
                        teacherid: teachers[i % teachers.length].id,
                        classid: classes[i % classes.length].id,
                        students: {
                            connect: students.map(s => ({ id: s.id })),
                        },
                    },
                })
            )
        );

        // Seed Submissions
        const submissions = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.submission.create({
                    data: {
                        id: faker.string.uuid(),
                        answer: faker.lorem.paragraph(),
                        feedback: faker.lorem.sentence(),
                        score: faker.number.int({ min: 0, max: 100 }),
                        file: faker.image.url(),
                        assignmentId: assignments[i % assignments.length].id,
                        studentId: students[i % students.length].id,
                    },
                })
            )
        );

        // Seed Tests
        const tests = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.test.create({
                    data: {
                        id: faker.string.uuid(),
                        title: `Test ${i + 1}`,
                        status: faker.helpers.arrayElement([TestStatus.Completed, TestStatus.Cancelled, TestStatus.Pending]),
                        instructions: faker.lorem.paragraph(),
                        duration: faker.number.int({ min: 30, max: 120 }),
                        maxscore: 100,
                        open: faker.datatype.boolean(),
                        testdate: faker.date.soon({ days: 30 }),
                        testtime: faker.date.soon({ days: 30 }),
                        term: faker.helpers.arrayElement([Terms.First, Terms.Second, Terms.Third]),
                        subjectid: subjects[i % subjects.length].id,
                        teacherid: teachers[i % teachers.length].id,
                        classid: classes[i % classes.length].id,
                    },
                })
            )
        );

        // Seed Questions
        const questions = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.question.create({
                    data: {
                        id: faker.string.uuid(),
                        text: faker.lorem.sentence(),
                        options: {
                            a: faker.lorem.word(),
                            b: faker.lorem.word(),
                            c: faker.lorem.word(),
                            d: faker.lorem.word(),
                        },
                        answer: faker.lorem.word(),
                        testid: tests[i % tests.length].id,
                    },
                })
            )
        );

        // Seed Answers
        const answers = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.answer.create({
                    data: {
                        id: faker.string.uuid(),
                        score: faker.number.int({ min: 0, max: 100 }),
                        testid: tests[i % tests.length].id,
                        studentid: students[i % students.length].id,
                    },
                })
            )
        );

        // Seed News
        const news = await Promise.all(
            Array.from({ length: 5 }).map(() =>
                prisma.news.create({
                    data: {
                        id: faker.string.uuid(),
                        title: faker.lorem.words(3),
                        content: faker.lorem.paragraphs(3),
                        excerpt: faker.lorem.sentence(),
                        author: faker.person.fullName(),
                        category: faker.helpers.arrayElement([
                            NewsCategory.ACHIEVEMENT,
                            NewsCategory.SPORTS,
                            NewsCategory.FACILITIES,
                            NewsCategory.ARTS,
                            NewsCategory.EDUCATION,
                            NewsCategory.COMMUNITY,
                            NewsCategory.GENERAL,
                        ]),
                        status: faker.helpers.arrayElement([NewsStatus.DRAFT, NewsStatus.PUBLISHED, NewsStatus.ARCHIVED]),
                        featured: faker.datatype.boolean(),
                        image: faker.image.url(),
                        readTime: faker.number.int({ min: 1, max: 10 }),
                        publishedAt: faker.date.recent({ days: 30 }),
                    },
                })
            )
        );

        // Seed Gallery
        const galleries = await Promise.all(
            Array.from({ length: 5 }).map((_, i) =>
                prisma.gallery.create({
                    data: {
                        id: faker.string.uuid(),
                        title: faker.lorem.words(3),
                        description: faker.lorem.sentence(),
                        imageUrl: faker.image.url(),
                        category: faker.helpers.arrayElement([
                            GalleryCategory.CAROUSEL,
                            GalleryCategory.LOGO,
                            GalleryCategory.FACILITIES,
                            GalleryCategory.EVENTS,
                            GalleryCategory.STUDENTS,
                            GalleryCategory.TEACHERS,
                            GalleryCategory.ACHIEVEMENTS,
                            GalleryCategory.GENERAL,
                        ]),
                        isActive: true,
                        order: i + 1,
                    },
                })
            )
        );

        // Seed Notifications
        const notifications = await Promise.all(
            Array.from({ length: 10 }).map((_, i) =>
                prisma.notification.create({
                    data: {
                        id: faker.string.uuid(),
                        title: faker.lorem.words(3),
                        message: faker.lorem.sentence(),
                        type: faker.helpers.arrayElement([
                            NotificationType.PAYMENT_DUE,
                            NotificationType.PAYMENT_CONFIRMED,
                            NotificationType.NEW_USER,
                            NotificationType.NEW_EVENT,
                            NotificationType.NEW_ANNOUNCEMENT,
                            NotificationType.ASSIGNMENT_DUE,
                            NotificationType.TEST_SCHEDULED,
                            NotificationType.GENERAL,
                        ]),
                        broadcast: faker.datatype.boolean(),
                        isRead: false,
                        studentId: i % 2 === 0 ? students[i % students.length].id : null,
                        teacherId: i % 3 === 0 ? teachers[i % teachers.length].id : null,
                        parentId: i % 4 === 0 ? parents[i % parents.length].id : null,
                        adminId: i % 5 === 0 ? admins[i % admins.length].id : null,
                    },
                })
            )
        );

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error; // Rethrow to ensure errors are not silently ignored
    } finally {
        await prisma.$disconnect();
    }
}

seed().catch(console.error);