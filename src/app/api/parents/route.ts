import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { parentSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const where: Prisma.ParentWhereInput = {};

        // Restrict access based on user role
        if (userRole === UserRole.TEACHER) {
            // Teachers see parents of students in classes where they are form masters or have lessons
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
            // Parents can only see their own data
            where.id = session!.user.id;
        }

        const parents = await prisma.parent.findMany({
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
                avarta: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        students: true,
                        notifications: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse({ data: parents });
    } catch (error) {
        return handleError(error, 'Could not fetch parent records');
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
        if (validation.error) return validation.error;

        const bodyValidation = await validateRequestBody(request, parentSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { title, firstname, surname, othername, birthday, bloodgroup, gender, occupation, religion, state, lga, email, phone, address, password, active, avarta } = bodyValidation.data!;

        // Check if email or phone already exists
        const existingParent = await prisma.parent.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });

        if (existingParent) {
            return NextResponse.json(
                { error: existingParent.email === email ? 'Email already exists' : 'Phone already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

        const newParent = await prisma.parent.create({
            data: {
                title,
                firstname,
                surname,
                othername,
                birthday,
                bloodgroup,
                gender,
                occupation,
                religion,
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
                othername: true,
                email: true,
                birthday: true,
                bloodgroup: true,
                phone: true,
                gender: true,
                occupation: true,
                religion: true,
                state: true,
                lga: true,
                avarta: true,
                address: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return successResponse(newParent, 201);
    } catch (error) {
        return handleError(error, 'Could not create parent record.');
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

        const result = await prisma.parent.deleteMany({
            where: { id: { in: safeIds } }
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} parent records`
        });
    } catch (error) {
        return handleError(error, 'Could not delete the selected parent records');
    }
}