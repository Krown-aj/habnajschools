import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { attendanceSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.AttendanceWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            // Teachers see attendances for lessons they teach or classes where they are form masters
            where.lesson = {
                OR: [
                    { teacherid: session!.user.id },
                    { class: { formmasterid: session!.user.id } }
                ]
            };
        } else if (userRole === UserRole.PARENT) {
            // Parents see attendances for their children
            where.student = {
                parentid: session!.user.id
            };
        }

        const attendances = await prisma.attendance.findMany({
            where,
            select: {
                id: true,
                present: true,
                lesson: {
                    select: {
                        id: true,
                        name: true,
                        day: true,
                        startTime: true,
                        endTime: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        othername: true
                    }
                }
            },
        });

        return successResponse({ data: attendances });
    } catch (error) {
        return handleError(error, 'Failed to fetch attendances');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const bodyValidation = await validateRequestBody(request, attendanceSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { studentId, lessonId, present, date } = bodyValidation.data!;

        // Validate studentId and lessonId
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
            return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true, classid: true, teacherid: true }
        });
        if (!lesson) {
            return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
        }

        // Ensure student is in the lesson's class
        if (student.classid !== lesson.classid) {
            return NextResponse.json({ error: 'Student is not in the lesson\'s class' }, { status: 400 });
        }

        // If teacher, ensure they are authorized for this lesson
        if (userRole === UserRole.TEACHER) {
            const classData = await prisma.class.findUnique({
                where: { id: lesson.classid },
                select: { formmasterid: true }
            });
            if (lesson.teacherid !== session!.user.id && (!classData || classData.formmasterid !== session!.user.id)) {
                return NextResponse.json({ error: 'Access denied: Not authorized for this lesson' }, { status: 403 });
            }
        }

        // Check if attendance already exists for this student and lesson
        const existingAttendance = await prisma.attendance.findFirst({
            where: { studentId, lessonId }
        });

        if (existingAttendance) {
            return NextResponse.json(
                { error: 'Attendance record already exists for this student and lesson' },
                { status: 409 }
            );
        }

        const newAttendance = await prisma.attendance.create({
            data: {
                studentId,
                lessonId,
                present,
                date
            },
            select: {
                id: true,
                student: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        othername: true
                    }
                },
                lesson: {
                    select: {
                        id: true,
                        name: true,
                        day: true,
                        startTime: true,
                        endTime: true
                    }
                },
                present: true,
                date: true,
            }
        });

        return successResponse(newAttendance, 201);
    } catch (error) {
        return handleError(error, 'Failed to create attendance');
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');

        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const result = await prisma.attendance.deleteMany({
            where: { id: { in: ids.map(id => parseInt(id)) } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} attendances`
        });
    } catch (error) {
        return handleError(error, 'Failed to delete attendances');
    }
}