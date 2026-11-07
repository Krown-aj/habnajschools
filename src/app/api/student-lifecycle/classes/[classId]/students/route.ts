import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleError, successResponse, UserRole, validateSession } from '@/lib/utils/api-helpers';

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.TEACHER]);
    if (validation.error) return validation.error;
    const { classId } = await params;

    if (validation.userRole === UserRole.TEACHER) {
      const assignedClass = await prisma.class.findFirst({
        where: { id: classId, formmasterid: validation.session!.user.id },
        select: { id: true },
      });
      if (!assignedClass) return NextResponse.json({ error: 'You can only manage students in your assigned class.' }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: { classid: classId },
      select: {
        id: true,
        admissionnumber: true,
        firstname: true,
        othername: true,
        surname: true,
        gender: true,
        active: true,
        enrollmentStatus: true,
        classid: true,
        section: true,
        promotions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, promotedAt: true },
        },
      },
      orderBy: [{ surname: 'asc' }, { firstname: 'asc' }],
    });

    const response = successResponse(students.map(({ promotions, ...student }) => ({
      ...student,
      latestLifecycleStatus: promotions[0]?.status ?? null,
    })));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    return handleError(error, 'Failed to fetch class students');
  }
}
