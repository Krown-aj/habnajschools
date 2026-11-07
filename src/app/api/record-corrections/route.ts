import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleError, successResponse, UserRole, validateSession } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT]);
    if (validation.error) return validation.error;

    const url = new URL(request.url);
    const recordType = url.searchParams.get('recordType');
    const recordId = url.searchParams.get('recordId');
    if (!recordId || !['STUDENT', 'PARENT', 'STUDENT_DELETION'].includes(recordType ?? '')) {
      return NextResponse.json({ error: 'A valid record type and record ID are required.' }, { status: 400 });
    }

    const corrections = await prisma.recordCorrection.findMany({
      where: { recordType: recordType!, recordId },
      select: {
        id: true,
        recordType: true,
        recordId: true,
        studentId: true,
        reason: true,
        before: true,
        after: true,
        actorId: true,
        actorRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const actorIds = [...new Set(corrections.map((entry) => entry.actorId))];
    const [administrators, parents, students] = actorIds.length
      ? await Promise.all([
          prisma.administration.findMany({ where: { id: { in: actorIds } }, select: { id: true, username: true, email: true } }),
          prisma.parent.findMany({ where: { id: { in: actorIds } }, select: { id: true, firstname: true, surname: true } }),
          prisma.student.findMany({ where: { id: { in: actorIds } }, select: { id: true, firstname: true, surname: true } }),
        ])
      : [[], [], []];
    const actorLabels = new Map<string, string>();
    administrators.forEach((actor) => actorLabels.set(actor.id, actor.username || actor.email || actor.id));
    [...parents, ...students].forEach((actor) => actorLabels.set(actor.id, `${actor.firstname} ${actor.surname}`.trim()));

    const response = successResponse(corrections.map((entry) => ({
      ...entry,
      actorLabel: actorLabels.get(entry.actorId) ?? entry.actorId,
    })));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    return handleError(error, 'Failed to fetch correction history');
  }
}
