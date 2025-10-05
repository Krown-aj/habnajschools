import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { studentUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the student exists
        const resourceCheck = await checkResourceExists(
            prisma.student,
            id,
            'Student not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.StudentWhereInput = { id: id };
        if (userRole === UserRole.TEACHER) {
            where.class = {
                OR: [
                    { formmasterid: session!.user.id },
                    { lessons: { some: { teacherid: session!.user.id } } }
                ]
            };
        } else if (userRole === UserRole.PARENT) {
            where.parentid = session!.user.id;
        }

        const student = await prisma.student.findFirst({
            where,
            select: {
                id: true,
                admissionnumber: true,
                firstname: true,
                surname: true,
                othername: true,
                birthday: true,
                religion: true,
                house: true,
                bloodgroup: true,
                admissiondate: true,
                email: true,
                phone: true,
                gender: true,
                active: true,
                address: true,
                state: true,
                lga: true,
                avarta: true,
                class: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                    }
                },
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        attendances: true,
                        assignments: true,
                        submissions: true,
                        reportCards: true,
                        payments: true
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Access denied or student not found' }, { status: 403 });
        }

        return successResponse(student);
    } catch (error) {
        return handleError(error, 'Failed to fetch student');
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.STUDENT]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.student,
            id,
            'Student not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, studentUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { firstname, surname, othername, birthday, gender, religion, house, bloodgroup, admissiondate, email, phone, address, state, lga, avarta, password, active, parentid, classid } = bodyValidation.data!;

        // Check for email or phone conflicts
        if (email || phone) {
            const existingStudent = await prisma.student.findFirst({
                where: {
                    OR: [
                        { email: email || null, id: { not: id } },
                        { phone: phone || null, id: { not: id } }
                    ]
                }
            });

            if (existingStudent) {
                return NextResponse.json(
                    {
                        error:
                            existingStudent.email === email ? 'Email already exists' :
                                'Phone already exists'
                    },
                    { status: 409 }
                );
            }
        }

        // Validate parentid and classid if provided
        if (parentid) {
            const parent = await prisma.parent.findUnique({ where: { id: parentid } });
            if (!parent) {
                return NextResponse.json({ error: 'Invalid parent ID' }, { status: 400 });
            }
        }

        if (classid) {
            const classData = await prisma.class.findUnique({
                where: { id: classid },
                select: { id: true, capacity: true, _count: { select: { students: true } } }
            });
            if (!classData) {
                return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
            }

            // Check class capacity (exclude current student from count if updating their class)
            const currentStudent = await prisma.student.findUnique({
                where: { id: id },
                select: { classid: true }
            });
            const isSameClass = currentStudent?.classid === classid;
            if (classData.capacity && classData._count.students >= classData.capacity && !isSameClass) {
                return NextResponse.json({ error: 'Class capacity exceeded' }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (firstname) updateData.firstname = firstname;
        if (surname) updateData.surname = surname;
        if (othername !== undefined) updateData.othername = othername;
        if (birthday) updateData.birthday = birthday;
        if (gender) updateData.gender = gender;
        if (religion !== undefined) updateData.religion = religion;
        if (house) updateData.house = house;
        if (bloodgroup !== undefined) updateData.bloodgroup = bloodgroup;
        if (admissiondate) updateData.admissiondate = admissiondate;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address) updateData.address = address;
        if (state) updateData.state = state;
        if (lga) updateData.lga = lga;
        if (avarta !== undefined) updateData.avarta = avarta;
        if (password) updateData.password = await bcrypt.hash(password, 12);
        if (active !== undefined) updateData.active = active;
        if (parentid) updateData.parentid = parentid;
        if (classid) updateData.classid = classid;

        const updatedStudent = await prisma.student.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                admissionnumber: true,
                firstname: true,
                surname: true,
                email: true,
                phone: true,
                gender: true,
                active: true,
                classid: true,
                parentid: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(updatedStudent);
    } catch (error) {
        return handleError(error, 'Failed to update student');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER,]);
        if (validation.error) return validation.error;

        const resourceCheck = await checkResourceExists(
            prisma.student,
            id,
            'Student not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.student.delete({
            where: { id: id }
        });

        return successResponse({ message: 'Student deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete student');
    }
}