import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PromotionStatus } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { bulkStudentLifecycleSchema } from '@/lib/schemas/index';
import { handleError, successResponse, UserRole, validateRequestBody, validateSession } from '@/lib/utils/api-helpers';

class LifecycleRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.TEACHER]);
    if (validation.error) return validation.error;

    const bodyValidation = await validateRequestBody(request, bulkStudentLifecycleSchema);
    if (bodyValidation.error) return bodyValidation.error;
    const { sourceClassId, studentIds, status, toClassId, session, effectiveDate, remark } = bodyValidation.data!;
    const effectiveAt = effectiveDate instanceof Date ? effectiveDate : new Date(effectiveDate);
    if (effectiveAt.getTime() > Date.now()) {
      return NextResponse.json({ error: 'Future-dated class changes are not supported because placement changes take effect immediately.' }, { status: 400 });
    }

    const targetRequired = status === PromotionStatus.PROMOTED
      || status === PromotionStatus.TRANSFERRED
      || status === PromotionStatus.REENROLLED;
    if (targetRequired && !toClassId) {
      return NextResponse.json({ error: 'Select the destination class for this operation.' }, { status: 400 });
    }
    if (!targetRequired && toClassId && toClassId !== sourceClassId) {
      return NextResponse.json({ error: 'This operation keeps the student in the current class.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const schoolTerm = await tx.term.findFirst({ where: { session }, select: { id: true } });
      if (!schoolTerm) throw new LifecycleRequestError('Select a school session configured in the system.', 400);

      const sourceClass = await tx.class.findUnique({
        where: { id: sourceClassId },
        select: { id: true, name: true, section: true, ...(validation.userRole === UserRole.TEACHER ? { formmasterid: true } : {}) },
      });
      if (!sourceClass) throw new LifecycleRequestError('Selected class was not found.', 404);
      if (validation.userRole === UserRole.TEACHER && sourceClass.formmasterid !== validation.session!.user.id) {
        throw new LifecycleRequestError('You can only operate on students in your assigned class.', 403);
      }

      const targetClassId = toClassId ?? sourceClassId;
      const targetClass = targetClassId === sourceClassId
        ? sourceClass
        : await tx.class.findUnique({ where: { id: targetClassId }, select: { id: true, name: true, section: true } });
      if (!targetClass) throw new LifecycleRequestError('Destination class was not found.', 400);
      if ((status === PromotionStatus.PROMOTED || status === PromotionStatus.TRANSFERRED) && targetClass.id === sourceClass.id) {
        throw new LifecycleRequestError('Choose a different destination class.', 400);
      }
      if (status === PromotionStatus.REPEATED && targetClass.id !== sourceClass.id) {
        throw new LifecycleRequestError('A repeated year must keep students in the current class.', 400);
      }

      const selectedStudents = await tx.student.findMany({
        where: { id: { in: studentIds }, classid: sourceClassId },
        select: {
          id: true,
          admissionnumber: true,
          firstname: true,
          surname: true,
          active: true,
          enrollmentStatus: true,
          classid: true,
          section: true,
          updatedAt: true,
        },
      });
      if (selectedStudents.length !== studentIds.length) {
        throw new LifecycleRequestError('One or more selected students no longer belong to this class. Reload the class roster.', 409);
      }

      for (const student of selectedStudents) {
        if (status === PromotionStatus.REENROLLED) {
          if (student.enrollmentStatus !== 'GRADUATED' && student.enrollmentStatus !== 'WITHDRAWN') {
            throw new LifecycleRequestError(`${student.firstname} ${student.surname} is not eligible for re-enrollment.`, 400);
          }
        } else if (student.enrollmentStatus !== 'ENROLLED') {
          throw new LifecycleRequestError(`${student.firstname} ${student.surname} is not currently enrolled; use re-enrollment or review the record.`, 400);
        }
      }

      const updatedStudents = [];
      for (const student of selectedStudents) {
        const exiting = status === PromotionStatus.GRADUATED || status === PromotionStatus.WITHDRAWN;
        const updated = await tx.student.update({
          where: { id: student.id, classid: sourceClassId, enrollmentStatus: student.enrollmentStatus, updatedAt: student.updatedAt },
          data: {
            classid: targetClass.id,
            section: targetClass.section ?? student.section,
            ...(exiting ? { enrollmentStatus: status === PromotionStatus.GRADUATED ? 'GRADUATED' : 'WITHDRAWN', active: false } : {}),
            ...(status === PromotionStatus.REENROLLED ? { enrollmentStatus: 'ENROLLED', active: true } : {}),
          },
          select: { id: true, admissionnumber: true, firstname: true, surname: true, active: true, enrollmentStatus: true, classid: true },
        });

        await tx.studentPromotion.create({
          data: {
            studentId: student.id,
            fromClassId: sourceClass.id,
            toClassId: targetClass.id,
            session,
            promotedAt: effectiveAt,
            status,
            remark,
            actorId: validation.session!.user.id,
          },
        });
        updatedStudents.push(updated);
      }

      return { operation: status, count: updatedStudents.length, students: updatedStudents };
    }, { timeout: 20000 });

    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof LifecycleRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'A student placement changed during this operation. No selected students were changed; reload and try again.' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'A selected class or student is no longer available. No selected students were changed.' }, { status: 409 });
    }
    return handleError(error, 'Failed to apply bulk student lifecycle operation');
  }
}
