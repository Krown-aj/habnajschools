import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { teacherSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.TeacherWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            // Teachers can only see their own data
            where.id = session!.user.id;
        } else if (userRole === UserRole.PARENT) {
            // Parents see teachers associated with their children's classes
            where.OR = [
                { classes: { some: { students: { some: { parentid: session!.user.id } } } } },
                { lessons: { some: { class: { students: { some: { parentid: session!.user.id } } } } } }
            ];
        }

        const teachers = await prisma.teacher.findMany({
            where,
            select: {
                id: true,
                title: true,
                firstname: true,
                surname: true,
                email: true,
                phone: true,
                gender: true,
                qualification: true,
                active: true,
                subjects: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                classes: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        name: true,
                        day: true,
                        startTime: true,
                        endTime: true,
                    }
                },
                notifications: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        subjects: true,
                        classes: true,
                        lessons: true,
                        assignments: true,
                        tests: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse({ data: teachers });
    } catch (error) {
        return handleError(error, 'Could not fetch teacher records');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, teacherSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, firstname, surname, othername, birthday, bloodgroup, gender, qualification, state, lga, email, phone, address, avarta, password, active } = bodyValidation.data!;

        // Check if email or phone already exists
        const existingTeacher = await prisma.teacher.findFirst({
            where: {
                OR: [
                    { email },
                    { phone: phone || null }
                ]
            }
        });

        if (existingTeacher) {
            return NextResponse.json(
                { error: existingTeacher.email === email ? 'Teacher with the same email already exists' : 'Teacher with the same phone already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

        const newTeacher = await prisma.teacher.create({
            data: {
                title,
                firstname,
                surname,
                othername,
                birthday,
                bloodgroup,
                gender,
                qualification,
                state,
                lga,
                email,
                phone,
                address,
                avarta,
                password: hashedPassword,
                active
            },
            select: {
                id: true,
                title: true,
                firstname: true,
                surname: true,
                email: true,
                phone: true,
                gender: true,
                qualification: true,
                active: true,
                subjects: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                classes: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        name: true,
                        day: true,
                        startTime: true,
                        endTime: true,
                    }
                },
                notifications: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(newTeacher, 201);
    } catch (error) {
        return handleError(error, 'Could not create teacher record.');
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');

        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Prevent deletion of current user
        const currentUserId = validation.session!.user.id;
        const safeIds = ids.filter(id => id !== currentUserId);

        if (safeIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid operation - you cannot delete your own account' },
                { status: 400 }
            );
        }

        const result = await prisma.teacher.deleteMany({
            where: { id: { in: safeIds } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} teacher records`
        });
    } catch (error) {
        return handleError(error, 'Could not delete the selected teacher records');
    }
}