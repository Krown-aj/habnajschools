import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleError, successResponse, UserRole, validateSession } from '@/lib/utils/api-helpers';

export async function GET(): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.TEACHER]);
    if (validation.error) return validation.error;

    const where = validation.userRole === UserRole.TEACHER
      ? { formmasterid: validation.session!.user.id }
      : {};
    const classes = await prisma.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        section: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    const response = successResponse(classes.map(({ _count, ...schoolClass }) => ({
      ...schoolClass,
      studentCount: _count.students,
    })));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    return handleError(error, 'Failed to fetch classes for student lifecycle management');
  }
}
