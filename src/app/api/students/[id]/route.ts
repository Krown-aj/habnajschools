import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { studentDeletionSchema, studentUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';
import { getCorrectionDiff } from '@/lib/record-corrections';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

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
        } else if (userRole === UserRole.STUDENT) {
            where.id = session!.user.id;
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
                section: true,
                lga: true,
                avarta: true,
                parentid: true,
                classid: true,
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
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.STUDENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const accessWhere: Prisma.StudentWhereInput = { id };
        if (userRole === UserRole.STUDENT) {
            accessWhere.id = session!.user.id;
        }
        const accessibleStudent = await prisma.student.findFirst({
            where: accessWhere,
            select: { id: true },
        });
        if (!accessibleStudent) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const bodyValidation = await validateRequestBody(request, studentUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { firstname, surname, othername, birthday, gender, religion, house, bloodgroup, admissiondate, /* email, phone, */ address, state, lga, avarta, password, active, parentid, classid, section, correctionReason } = bodyValidation.data!;

        // Enrollment, identity, account status, and password changes belong to authorized staff.
        // Students may update only their own profile fields, never official placement or account data.
        if (
            userRole === UserRole.STUDENT &&
            [admissiondate, password, active, parentid, classid, section].some((value) => value !== undefined)
        ) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check for email or phone conflicts
        /*  if (email || phone) {
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
         } */

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
            /*  const currentStudent = await prisma.student.findUnique({
                 where: { id: id },
                 select: { classid: true }
             });
             const isSameClass = currentStudent?.classid === classid;
             if (classData.capacity && classData._count.students >= classData.capacity && !isSameClass) {
                 return NextResponse.json({ error: 'Class capacity exceeded' }, { status: 400 });
             } */
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
        if (section) updateData.section = section;
        /* if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone; */
        if (address) updateData.address = address;
        if (state) updateData.state = state;
        if (lga) updateData.lga = lga;
        if (avarta !== undefined) updateData.avarta = avarta;
        if (password) updateData.password = await bcrypt.hash(password, 12);
        if (active !== undefined) updateData.active = active;
        if (parentid) updateData.parentid = parentid;
        if (classid) updateData.classid = classid;

        const correctionFields = ['firstname', 'surname', 'othername', 'birthday', 'gender', 'parentid'] as const;
        const updatedStudent = await prisma.$transaction(async (tx) => {
            const currentStudent = await tx.student.findUnique({
                where: { id },
                select: {
                    id: true,
                    firstname: true,
                    surname: true,
                    othername: true,
                    birthday: true,
                    gender: true,
                    parentid: true,
                    classid: true,
                    section: true,
                    updatedAt: true,
                },
            });
            if (!currentStudent) throw new Error('Student not found');
            if ((classid && classid !== currentStudent.classid) || (section && section !== currentStudent.section)) {
                throw new Error('Class and section changes must use the promotion or transfer workflow.');
            }

            const correction = getCorrectionDiff(currentStudent, updateData, correctionFields);
            if (correction && !correctionReason) {
                throw new Error('A correction reason is required when changing student identity or guardian details.');
            }

            const updated = await tx.student.update({
                where: { id, updatedAt: currentStudent.updatedAt },
                data: updateData,
                select: {
                    id: true,
                    admissionnumber: true,
                    firstname: true,
                    surname: true,
                    email: true,
                    phone: true,
                    section: true,
                    gender: true,
                    active: true,
                    classid: true,
                    parentid: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (correction && correctionReason) {
                await tx.recordCorrection.create({
                    data: {
                        recordType: 'STUDENT',
                        recordId: id,
                        studentId: id,
                        reason: correctionReason,
                        before: correction.before,
                        after: correction.after,
                        actorId: session!.user.id,
                        actorRole: userRole,
                    },
                });
            }
            return updated;
        });

        return successResponse(updatedStudent);
    } catch (error) {
        if (error instanceof Error && error.message === 'A correction reason is required when changing student identity or guardian details.') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof Error && error.message === 'Class and section changes must use the promotion or transfer workflow.') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json({ error: 'Student was changed by another request. Reload the record and try again.' }, { status: 409 });
        }
        return handleError(error, 'Failed to update student');
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER]);
        if (validation.error) return validation.error;
        const bodyValidation = await validateRequestBody(request, studentDeletionSchema);
        if (bodyValidation.error) return bodyValidation.error;
        const { reason } = bodyValidation.data!;

        await prisma.$transaction(async (tx) => {
            const student = await tx.student.findUnique({
                where: { id },
                select: {
                    id: true,
                    admissionnumber: true,
                    firstname: true,
                    othername: true,
                    surname: true,
                    enrollmentStatus: true,
                    classid: true,
                    section: true,
                },
            });
            if (!student) throw new Error('STUDENT_NOT_FOUND');

            await tx.recordCorrection.create({
                data: {
                    recordType: 'STUDENT_DELETION',
                    recordId: student.id,
                    studentId: student.id,
                    reason,
                    before: {
                        admissionnumber: student.admissionnumber,
                        firstname: student.firstname,
                        othername: student.othername,
                        surname: student.surname,
                        enrollmentStatus: student.enrollmentStatus,
                        classid: student.classid,
                        section: student.section,
                    },
                    after: { deleted: true },
                    actorId: validation.session!.user.id,
                    actorRole: validation.userRole,
                },
            });
            await tx.student.delete({ where: { id } });
        });

        return successResponse({ message: 'Student deleted successfully' });
    } catch (error) {
        if (error instanceof Error && error.message === 'STUDENT_NOT_FOUND') {
            return NextResponse.json({ error: 'Student record was not found.' }, { status: 404 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ error: 'This student has linked school records and cannot be permanently deleted. Use the withdrawal or graduation workflow instead.' }, { status: 409 });
        }
        return handleError(error, 'Failed to delete student');
    }
}
