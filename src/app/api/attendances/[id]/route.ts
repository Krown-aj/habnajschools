import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attendanceUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';
import { Prisma } from '@/generated/prisma/wasm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the attendance exists
        const resourceCheck = await checkResourceExists(
            prisma.attendance,
            id,
            'Attendance not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.AttendanceWhereInput = { id: parseInt(id) };
        if (userRole === UserRole.TEACHER) {
            where.lesson = {
                OR: [
                    { teacherid: session!.user.id },
                    { class: { formmasterid: session!.user.id } }
                ]
            };
        } else if (userRole === UserRole.PARENT) {
            where.student = {
                parentid: session!.user.id
            };
        } else if (userRole === UserRole.STUDENT) {
            where.studentId = session!.user.id;
        }

        const attendance = await prisma.attendance.findFirst({
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

        if (!attendance) {
            return NextResponse.json({ error: 'Access denied or attendance not found' }, { status: 403 });
        }

        return successResponse(attendance);
    } catch (error) {
        return handleError(error, 'Failed to fetch attendance');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        const bodyValidation = await validateRequestBody(request, attendanceUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { studentId, lessonId, present, date } = bodyValidation.data!;

        const existingAttendance = await prisma.attendance.findUnique({
            where: { id: parseInt(id) },
            select: {
                studentId: true,
                lessonId: true,
                lesson: { select: { teacherid: true, class: { select: { formmasterid: true } } } },
            },
        });
        if (!existingAttendance) return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });

        const targetStudentId = studentId ?? existingAttendance.studentId;
        const targetLessonId = lessonId ?? existingAttendance.lessonId;
        const [targetStudent, targetLesson] = await Promise.all([
            prisma.student.findUnique({ where: { id: targetStudentId }, select: { id: true, classid: true } }),
            prisma.lesson.findUnique({
                where: { id: targetLessonId },
                select: { id: true, classid: true, teacherid: true, class: { select: { formmasterid: true } } },
            }),
        ]);
        if (!targetStudent || !targetLesson) {
            return NextResponse.json({ error: 'Invalid student or lesson' }, { status: 400 });
        }
        if (targetStudent.classid !== targetLesson.classid) {
            return NextResponse.json({ error: "Student is not in the lesson's class" }, { status: 400 });
        }

        if (userRole === UserRole.TEACHER) {
            const canEditExisting = existingAttendance.lesson.teacherid === session!.user.id ||
                existingAttendance.lesson.class.formmasterid === session!.user.id;
            const canEditTarget = targetLesson.teacherid === session!.user.id ||
                targetLesson.class.formmasterid === session!.user.id;
            if (!canEditExisting || !canEditTarget) {
                return NextResponse.json({ error: 'Access denied: Not authorized for this lesson' }, { status: 403 });
            }
        }

        const updateData: any = {};
        if (studentId) updateData.studentId = studentId;
        if (lessonId) updateData.lessonId = lessonId;
        if (present !== undefined) updateData.present = present;
        if (date !== undefined) updateData.date = date;

        const updatedAttendance = await prisma.attendance.update({
            where: { id: parseInt(id) },
            data: updateData,
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

        return successResponse(updatedAttendance);
    } catch (error) {
        return handleError(error, 'Failed to update attendance');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.attendance,
            id,
            'Attendance not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.attendance.delete({
            where: { id: parseInt(id) }
        });

        return successResponse({ message: 'Attendance deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete attendance');
    }
}
