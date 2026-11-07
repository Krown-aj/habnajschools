import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PromotionStatus } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { studentClassMovementSchema } from '@/lib/schemas/index';
import { handleError, successResponse, UserRole, validateRequestBody, validateSession } from '@/lib/utils/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
    if (validation.error) return validation.error;
    const { id } = await params;

    const history = await prisma.studentPromotion.findMany({
      where: { studentId: id },
      select: {
        id: true,
        session: true,
        promotedAt: true,
        status: true,
        remark: true,
        actorId: true,
        fromClass: { select: { id: true, name: true } },
        toClass: { select: { id: true, name: true } },
      },
      orderBy: [{ promotedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const actorIds = [...new Set(history.map((entry) => entry.actorId).filter((actorId): actorId is string => Boolean(actorId)))];
    const actors = actorIds.length
      ? await prisma.administration.findMany({ where: { id: { in: actorIds } }, select: { id: true, username: true, email: true } })
      : [];
    const actorLabels = new Map(actors.map((actor) => [actor.id, actor.username || actor.email || actor.id]));

    const response = successResponse(history.map((entry) => ({
      ...entry,
      actorLabel: entry.actorId ? actorLabels.get(entry.actorId) ?? entry.actorId : 'Not recorded',
    })));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    return handleError(error, 'Failed to fetch student class history');
  }
}

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
    if (validation.error) return validation.error;
    const { id } = await params;

    const bodyValidation = await validateRequestBody(request, studentClassMovementSchema);
    if (bodyValidation.error) return bodyValidation.error;
    const { toClassId, session, effectiveDate, status, remark } = bodyValidation.data!;

    const destination = await prisma.class.findUnique({
      where: { id: toClassId },
      select: { id: true, name: true, section: true },
    });
    if (!destination) return NextResponse.json({ error: 'Selected class was not found.' }, { status: 400 });

    const movedStudent = await prisma.$transaction(async (tx) => {
      const schoolTerm = await tx.term.findFirst({ where: { session }, select: { id: true } });
      if (!schoolTerm) throw new Error('Select a school session configured in the system.');

      const current = await tx.student.findUnique({
        where: { id },
        select: { id: true, classid: true, section: true, updatedAt: true },
      });
      if (!current) throw new Error('Student not found.');
      const sameClass = current.classid === destination.id;
      if (status === PromotionStatus.REPEATED && !sameClass) {
        throw new Error('A repeated year must keep the student in the current class.');
      }
      if (status !== PromotionStatus.REPEATED && sameClass) {
        throw new Error('Choose a different class for promotion or transfer.');
      }

      const student = await tx.student.update({
        where: { id, classid: current.classid, updatedAt: current.updatedAt },
        data: { classid: destination.id, section: destination.section ?? current.section },
        select: { id: true, admissionnumber: true, classid: true, section: true },
      });

      const movement = await tx.studentPromotion.create({
        data: {
          studentId: id,
          fromClassId: current.classid,
          toClassId: destination.id,
          session,
          promotedAt: effectiveDate instanceof Date ? effectiveDate : new Date(effectiveDate),
          status,
          remark,
          actorId: validation.session!.user.id,
        },
        select: {
          id: true,
          session: true,
          promotedAt: true,
          status: true,
          remark: true,
          fromClass: { select: { id: true, name: true } },
          toClass: { select: { id: true, name: true } },
        },
      });
      return { student, movement };
    });

    return successResponse(movedStudent, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Student not found.') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Select a school session configured in the system.') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && (error.message === 'A repeated year must keep the student in the current class.' || error.message === 'Choose a different class for promotion or transfer.')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Student placement changed during this request. Reload and try again.' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'The selected class or student is no longer available.' }, { status: 409 });
    }
    return handleError(error, 'Failed to change student class placement');
  }
}
