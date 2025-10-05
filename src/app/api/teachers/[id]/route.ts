import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { teacherUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the teacher exists
        const resourceCheck = await checkResourceExists(
            prisma.teacher,
            id,
            'Teacher not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.TeacherWhereInput = { id: id };
        if (userRole === UserRole.TEACHER) {
            where.id = session!.user.id;
        } else if (userRole === UserRole.PARENT) {
            where.OR = [
                { classes: { some: { students: { some: { parentid: session!.user.id } } } } },
                { lessons: { some: { class: { students: { some: { parentid: session!.user.id } } } } } }
            ];
        }

        const teacher = await prisma.teacher.findFirst({
            where,
            select: {
                id: true,
                title: true,
                firstname: true,
                surname: true,
                othername: true,
                birthday: true,
                bloodgroup: true,
                state: true,
                lga: true,
                address: true,
                avarta: true,
                email: true,
                phone: true,
                gender: true,
                active: true,
                subjects: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
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
            }
        });

        if (!teacher) {
            return NextResponse.json({ error: 'Access denied or teacher not found' }, { status: 403 });
        }

        return successResponse(teacher);
    } catch (error) {
        return handleError(error, 'Could not fetch teacher records');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Only super/admin can update any teacher, teachers can only update their own data
        if (userRole === UserRole.TEACHER && id !== session!.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const resourceCheck = await checkResourceExists(
            prisma.teacher,
            id,
            'Teacher not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, teacherUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, firstname, surname, othername, birthday, bloodgroup, gender, state, lga, email, phone, address, avarta, password, active } = bodyValidation.data!;

        // Check for email or phone conflicts
        if (email || phone) {
            const existingTeacher = await prisma.teacher.findFirst({
                where: {
                    OR: [
                        { email, id: { not: id } },
                        { phone: phone || null, id: { not: id } }
                    ]
                }
            });

            if (existingTeacher) {
                return NextResponse.json(
                    { error: existingTeacher.email === email ? 'Email already exists' : 'Phone already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (firstname) updateData.firstname = firstname;
        if (surname) updateData.surname = surname;
        if (othername !== undefined) updateData.othername = othername;
        if (birthday) updateData.birthday = birthday;
        if (bloodgroup !== undefined) updateData.bloodgroup = bloodgroup;
        if (gender) updateData.gender = gender;
        if (state) updateData.state = state;
        if (lga) updateData.lga = lga;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address) updateData.address = address;
        if (avarta !== undefined) updateData.avarta = avarta;
        if (password) updateData.password = await bcrypt.hash(password, 12);
        if (active !== undefined && userRole !== UserRole.TEACHER) updateData.active = active;

        const updatedTeacher = await prisma.teacher.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                title: true,
                firstname: true,
                surname: true,
                othername: true,
                birthday: true,
                bloodgroup: true,
                avarta: true,
                email: true,
                phone: true,
                gender: true,
                state: true,
                lga: true,
                address: true,
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
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(updatedTeacher);
    } catch (error) {
        return handleError(error, 'Could not update teacher record');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const { session } = validation;

        // Prevent deletion of current user
        if (id === session!.user.id) {
            return NextResponse.json(
                { error: 'Invalid operation - You cannot delete your own account' },
                { status: 400 }
            );
        }

        const resourceCheck = await checkResourceExists(
            prisma.teacher,
            id,
            'Teacher not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.teacher.delete({
            where: { id: id }
        });

        return successResponse({ message: 'Teacher record deleted successfully' });
    } catch (error) {
        return handleError(error, 'Could not delete teacher record');
    }
}