import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        // Normalize requested role; fallback to session role
        const requestedRole = (searchParams.get('role') || (session.user as any)?.role || '').toString();
        const role = requestedRole.toLowerCase() as UserRole;

        // Validate role
        if (!Object.values(UserRole).includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Base stats (no school scoping since schema has no School model)
        const baseStats = {
            students: await prisma.student.count(),
            teachers: await prisma.teacher.count(),
            classes: await prisma.class.count(),
            subjects: await prisma.subject.count(),
        };

        // Role-specific stats
        let roleSpecificStats: any = {};

        switch (role) {
            case UserRole.SUPER:
            case UserRole.ADMIN:
            case UserRole.MANAGEMENT: {
                // Administration counts
                const [adminCount, superCount, managementCount] = await Promise.all([
                    prisma.administration.count({ where: { role: "Admin" } }),
                    prisma.administration.count({ where: { role: "Super" } }),
                    prisma.administration.count({ where: { role: "Management" } }),
                ]);

                // Parents count (all parents since no school scoping)
                const parentsCount = await prisma.parent.count();

                roleSpecificStats = {
                    ...baseStats,
                    parents: parentsCount,
                    admins: adminCount,
                    superAdmins: superCount,
                    managementUsers: managementCount,
                    administrations: adminCount + superCount + managementCount,
                    announcements: await prisma.announcement.count(),
                    events: await prisma.event.count(),
                    lessons: await prisma.lesson.count(),
                    assignments: await prisma.assignment.count(),
                    tests: await prisma.test.count(),
                    // Gender distribution for students
                    studentsByGender: await prisma.student.groupBy({
                        by: ['gender'],
                        _count: { _all: true },
                    }),
                    // Recent counts (last 30 days)
                    recentStudents: await prisma.student.count({
                        where: {
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    recentTeachers: await prisma.teacher.count({
                        where: {
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    // Payments
                    totalPayments: await prisma.payment.count(),
                    recentPayments: await prisma.payment.count({
                        where: {
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    // Payment setup count
                    paymentSetups: await prisma.paymentSetup.count(),
                    // Grade and assessment counts
                    grades: await prisma.reportCard.count(),
                    submissions: await prisma.submission.count(),
                    answers: await prisma.answer.count(),
                };
                break;
            }

            case UserRole.TEACHER: {
                const teacherId = (session.user as any)?.id as string;

                const teacherSubjects = await prisma.subject.findMany({
                    where: { teachers: { some: { id: teacherId } } },
                    include: {
                        _count: { select: { assignments: true, tests: true, lessons: true, } },
                        teachers: { select: { id: true, firstname: true, surname: true, othername: true, title: true } },
                    },
                });

                const teacherLessons = await prisma.lesson.findMany({
                    where: { teacher: { id: teacherId } },
                    include: {
                        class: { include: { _count: { select: { students: true } } } },
                    },
                });

                const uniqueClassIds = [...new Set(teacherLessons.map((l) => l.classid))];
                const totalStudents = teacherLessons.reduce((total, lesson) => {
                    return total + (lesson.class as any)?._count?.students || 0;
                }, 0);

                roleSpecificStats = {
                    mySubjects: teacherSubjects.length,
                    myLessons: teacherLessons.length,
                    myStudents: totalStudents,
                    myClasses: uniqueClassIds.length,
                    myAssignments: await prisma.assignment.count({
                        where: { teacherid: teacherId },
                    }),
                    myTests: await prisma.test.count({
                        where: { teacherid: teacherId },
                    }),
                    pendingTests: await prisma.test.count({
                        where: { teacherid: teacherId, status: 'Pending' },
                    }),
                    completedTests: await prisma.test.count({
                        where: { teacherid: teacherId, status: 'Completed' },
                    }),
                    mySubmissions: await prisma.submission.count({
                        where: { assignment: { teacherid: teacherId } },
                    }),
                };
                break;
            }

            case UserRole.STUDENT: {
                const studentId = (session.user as any)?.id as string;
                const studentData = await prisma.student.findUnique({
                    where: { id: studentId },
                    include: {
                        class: { select: { id: true, name: true } },
                        parent: { select: { firstname: true, surname: true, phone: true, email: true } },
                    },
                });

                if (studentData) {
                    const classmatesCount = await prisma.student.count({
                        where: { classid: studentData.classid, id: { not: studentId } },
                    });

                    const classAssignments = await prisma.assignment.count({
                        where: {
                            students: { some: { id: studentId } },
                        },
                    });

                    const classTests = await prisma.test.count({
                        where: {
                            subject: {
                                lessons: { some: { classid: studentData.classid } },
                            },
                        },
                    });

                    roleSpecificStats = {
                        myClass: studentData.class?.name || 'Not assigned',
                        classmates: classmatesCount,
                        myAssignments: classAssignments,
                        myTests: classTests,
                        myAttendance: await prisma.attendance.count({
                            where: {
                                studentId: studentId,
                                present: true,
                                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                            },
                        }),
                        totalAttendanceDays: await prisma.attendance.count({
                            where: {
                                studentId: studentId,
                                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                            },
                        }),
                        mySubmissions: await prisma.submission.count({ where: { studentId: studentId } }),
                        myAnswers: await prisma.answer.count({ where: { studentid: studentId } }),
                        parentInfo: {
                            name: `${studentData.parent.firstname} ${studentData.parent.surname}`,
                            phone: studentData.parent.phone,
                            email: studentData.parent.email,
                        },
                    };
                }
                break;
            }

            case UserRole.PARENT: {
                const parentId = (session.user as any)?.id as string;

                const children = await prisma.student.findMany({
                    where: { parentid: parentId },
                    include: {
                        class: { select: { name: true } },
                        payments: { select: { amount: true, createdAt: true } },
                    },
                });

                const totalFees = children.reduce(
                    (total, c) => total + (c.payments?.reduce((s, p) => s + p.amount, 0) || 0),
                    0
                );

                roleSpecificStats = {
                    children: children.length,
                    childrenDetails: children.map((child) => ({
                        id: child.id,
                        name: `${child.firstname} ${child.surname}`,
                        class: child.class?.name || 'Not assigned',
                        admissionNumber: child.admissionnumber,
                    })),
                    totalPayments: await prisma.payment.count({
                        where: { student: { parentid: parentId } },
                    }),
                    totalFeesPaid: totalFees,
                    recentPayments: await prisma.payment.count({
                        where: {
                            student: { parentid: parentId },
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    childrenAttendance: await prisma.attendance.count({
                        where: {
                            student: { parentid: parentId },
                            present: true,
                            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    totalAttendanceDays: await prisma.attendance.count({
                        where: {
                            student: { parentid: parentId },
                            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                };
                break;
            }

            default:
                roleSpecificStats = baseStats;
        }

        // Attendance data for charts (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const attendanceData = await prisma.attendance.findMany({
            where: {
                date: { gte: sevenDaysAgo },
                ...(role === UserRole.PARENT
                    ? { student: { parentid: (session.user as any).id } }
                    : role === UserRole.STUDENT
                        ? { studentid: (session.user as any).id }
                        : role === UserRole.TEACHER
                            ? {
                                lesson: {
                                    OR: [
                                        { teacherid: (session.user as any).id },
                                        { class: { formmasterid: (session.user as any).id } },
                                    ],
                                },
                            }
                            : {}),
            },
            select: { date: true, present: true },
        });

        const attendanceByDay = attendanceData.reduce((acc: any, record) => {
            const day = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
            if (!acc[day]) acc[day] = { present: 0, absent: 0 };
            if (record.present) acc[day].present++;
            else acc[day].absent++;
            return acc;
        }, {});

        const chartData = Object.entries(attendanceByDay).map(([day, data]: [string, any]) => ({
            name: day,
            present: data.present,
            absent: data.absent,
        }));

        // Current term
        const currentTerm = await prisma.term.findFirst({
            where: { status: 'Active' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                session: true,
                term: true,
                start: true,
                end: true,
                nextterm: true,
                daysopen: true,
                status: true,
            },
        });

        // Recent announcements and events
        const recentAnnouncements = await prisma.announcement.findMany({
            take: 3,
            orderBy: { date: 'desc' },
            select: { id: true, title: true, description: true, date: true },
            where:
                role === UserRole.PARENT
                    ? {
                        class: {
                            students: {
                                some: { parentid: (session.user as any).id },
                            },
                        },
                    }
                    : role === UserRole.STUDENT
                        ? {
                            class: {
                                students: {
                                    some: { id: (session.user as any).id },
                                },
                            },
                        }
                        : role === UserRole.TEACHER
                            ? {
                                class: {
                                    OR: [
                                        { formmasterid: (session.user as any).id },
                                        { lessons: { some: { teacherid: (session.user as any).id } } },
                                    ],
                                },
                            }
                            : {},
        });

        const recentEvents = await prisma.event.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            select: { id: true, title: true, description: true, startTime: true, endTime: true },
            where:
                role === UserRole.PARENT
                    ? {
                        class: {
                            students: {
                                some: { parentid: (session.user as any).id },
                            },
                        },
                    }
                    : role === UserRole.STUDENT
                        ? {
                            class: {
                                students: {
                                    some: { id: (session.user as any).id },
                                }
                            },
                        }
                        : role === UserRole.TEACHER
                            ? {
                                class: {
                                    OR: [
                                        { formmasterid: (session.user as any).id },
                                        { lessons: { some: { teacherid: (session.user as any).id } } },
                                    ],
                                },
                            }
                            : {},
        });

        // Ensure studentsByGender is present
        if (!('studentsByGender' in roleSpecificStats)) {
            roleSpecificStats.studentsByGender = await prisma.student.groupBy({
                by: ['gender'],
                where:
                    role === UserRole.PARENT
                        ? { parentid: (session.user as any).id }
                        : role === UserRole.STUDENT
                            ? { id: (session.user as any).id }
                            : role === UserRole.TEACHER
                                ? {
                                    class: {
                                        OR: [
                                            { formmasterid: (session.user as any).id },
                                            { lessons: { some: { teacherid: (session.user as any).id } } },
                                        ],
                                    },
                                }
                                : undefined,
                _count: { _all: true },
            });
        }

        return NextResponse.json({
            success: true,
            role,
            stats: roleSpecificStats,
            charts: {
                attendance: chartData,
                studentsByGender: roleSpecificStats.studentsByGender,
            },
            currentTerm: currentTerm || null,
            recentActivity: {
                announcements: recentAnnouncements,
                events: recentEvents,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch statistics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}