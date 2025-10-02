import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { parentUpdateSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, checkResourceExists, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Check if the parent exists
        const resourceCheck = await checkResourceExists(
            prisma.parent,
            id,
            'Parent not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        // Restrict access based on user role
        const where: Prisma.ParentWhereInput = { id: id };
        if (userRole === UserRole.TEACHER) {
            where.students = {
                some: {
                    class: {
                        OR: [
                            { formmasterid: session!.user.id },
                            { lessons: { some: { teacherid: session!.user.id } } }
                        ]
                    }
                }
            };
        } else if (userRole === UserRole.PARENT) {
            where.id = session!.user.id;
        }

        const parent = await prisma.parent.findFirst({
            where,
            select: {
                id: true,
                title: true,
                firstname: true,
                surname: true,
                othername: true,
                email: true,
                phone: true,
                gender: true,
                birthday: true,
                bloodgroup: true,
                occupation: true,
                religion: true,
                state: true,
                lga: true,
                address: true,
                active: true,
                students: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        othername: true,
                        class: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        students: true,
                        notifications: true
                    }
                }
            }
        });

        if (!parent) {
            return NextResponse.json({ error: 'Access denied or parent not found' }, { status: 403 });
        }

        return successResponse(parent);
    } catch (error) {
        return handleError(error, 'Could not fetch parent records');
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    try {
        const { id } = await params;
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;

        // Only super/admin/management can update any parent, parents can only update their own data
        if (userRole === UserRole.PARENT && id !== session!.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const resourceCheck = await checkResourceExists(
            prisma.parent,
            id,
            'Parent not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        const bodyValidation = await validateRequestBody(request, parentUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, firstname, surname, othername, birthday, bloodgroup, gender, occupation, religion, state, lga, email, phone, address, password, active } = bodyValidation.data!;

        // Check for email or phone conflicts
        if (email || phone) {
            const existingParent = await prisma.parent.findFirst({
                where: {
                    OR: [
                        { email, id: { not: id } },
                        { phone, id: { not: id } }
                    ]
                }
            });

            if (existingParent) {
                return NextResponse.json(
                    { error: existingParent.email === email ? 'Email already exists' : 'Phone already exists' },
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
        if (occupation) updateData.occupation = occupation;
        if (religion) updateData.religion = religion;
        if (state) updateData.state = state;
        if (lga) updateData.lga = lga;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (password) updateData.password = await bcrypt.hash(password, 12);
        if (active !== undefined && userRole !== UserRole.PARENT) updateData.active = active;

        const updatedParent = await prisma.parent.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                title: true,
                firstname: true,
                surname: true,
                othername: true,
                email: true,
                phone: true,
                gender: true,
                birthday: true,
                bloodgroup: true,
                occupation: true,
                religion: true,
                state: true,
                lga: true,
                address: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(updatedParent);
    } catch (error) {
        return handleError(error, 'Failed to update parent');
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
            prisma.parent,
            id,
            'Parent not found'
        );
        if (resourceCheck.error) return resourceCheck.error;

        await prisma.parent.delete({
            where: { id: id }
        });

        return successResponse({ message: 'Parent deleted successfully' });
    } catch (error) {
        return handleError(error, 'Failed to delete parent');
    }
}