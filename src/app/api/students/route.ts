import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { studentAdmissionSchema, studentDeletionSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

const studentAdmissionResponseSelect = {
  id: true,
  admissionnumber: true,
  firstname: true,
  surname: true,
  othername: true,
  email: true,
  phone: true,
  gender: true,
  birthday: true,
  avarta: true,
  address: true,
  section: true,
  state: true,
  lga: true,
  house: true,
  bloodgroup: true,
  active: true,
  class: { select: { id: true, name: true, category: true } },
  parent: { select: { id: true, title: true, firstname: true, surname: true, othername: true, phone: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StudentSelect;

const generateAdmissionNumber = (
  existingAdmissions: string[] = [],
  currentDate = new Date(),
  prefix = 'HAB'
) => {
  const yearStr = currentDate.getFullYear().toString();
  const safePrefix = prefix || '';
  const escapedPrefix = safePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}/${yearStr}/(\\d{5})$`);
  const sequences = existingAdmissions.reduce((acc: number[], admission: string) => {
    const match = admission.match(regex);
    if (match) acc.push(parseInt(match[1], 10));
    return acc;
  }, []);
  const baseSequence = 1;
  const nextSequence = sequences.length === 0 ? baseSequence : Math.max(...sequences) + 1;
  const paddedSequence = nextSequence.toString().padStart(5, '0');
  return `${safePrefix}/${yearStr}/${paddedSequence}`;
};

const isAdmissionNumberConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'P2002') return false;
  const target = 'meta' in error && error.meta && typeof error.meta === 'object' && 'target' in error.meta
    ? error.meta.target
    : undefined;
  const targetDescription = Array.isArray(target) ? target.join(' ') : String(target ?? '');
  return targetDescription.toLocaleLowerCase().includes('admissionnumber');
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Protect route
    const validation = await validateSession([
      UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT,
      UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT,
    ]);
    if (validation.error) return validation.error;
    const { session, userRole } = validation;

    const url = new URL(request.url);
    const classParam = url.searchParams.get("classid");
    const sectionParam = url.searchParams.get("section");
    const parentParam = url.searchParams.get("parentid");
    const teacherParam = url.searchParams.get("teacherid");

    const whereClauses: Prisma.StudentWhereInput[] = [];

    /* -------------------- Base filters -------------------- */

    if (classParam) {
      whereClauses.push({ classid: classParam });
    }

    if (userRole === UserRole.PARENT) {
      whereClauses.push({ parentid: session.user.id });
    } else if (parentParam && userRole !== UserRole.TEACHER && userRole !== UserRole.STUDENT) {
      whereClauses.push({ parentid: parentParam });
    }

    if (userRole === UserRole.STUDENT) {
      whereClauses.push({ id: session.user.id });
    }

    /* -------------------- Teacher-specific logic -------------------- */

    if (userRole === UserRole.TEACHER) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.user.id },
        select: { section: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { message: "Teacher not found" },
          { status: 404 }
        );
      }

      if (!teacher.section) {
        return NextResponse.json(
          { message: "Teacher has no assigned section" },
          { status: 400 }
        );
      }

      /**
       * STRICT rule:
       * - student.section must match teacher.section
       * - teacher must be related to the class
       */
      whereClauses.push({
        section: {
          equals: teacher.section,
          mode: "insensitive",
        },
      });
      whereClauses.push({
        class: {
          OR: [
            { formmasterid: session.user.id },
            { lessons: { some: { teacherid: session.user.id } } },
          ],
        },
      });
    } else {
      // Non-teacher requests can filter by section freely
      if (sectionParam && userRole !== UserRole.PARENT && userRole !== UserRole.STUDENT) {
        whereClauses.push({ section: sectionParam });
      }
    }

    const where: Prisma.StudentWhereInput =
      whereClauses.length > 0 ? { AND: whereClauses } : {};

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        admissionnumber: true,
        firstname: true,
        surname: true,
        othername: true,
        birthday: true,
        email: true,
        phone: true,
        gender: true,
        religion: true,
        section: true,
        house: true,
        bloodgroup: true,
        active: true,
        avarta: true,
        address: true,
        state: true,
        lga: true,
        parent: {
          select: {
            id: true,
            firstname: true,
            surname: true,
            othername: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attendances: true,
            assignments: true,
            submissions: true,
            reportCards: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ data: students });
  } catch (error) {
    return handleError(error, "Failed to fetch students");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN]);
    if (validation.error) return validation.error;

    const bodyValidation = await validateRequestBody(request, studentAdmissionSchema);
    if (bodyValidation.error) return bodyValidation.error;

    const admission = bodyValidation.data!;
    const {
      firstname,
      surname,
      othername,
      birthday,
      gender,
      religion,
      house,
      bloodgroup,
      admissiondate,
      address,
      section,
      state,
      lga,
      avarta,
      password,
      active,
      classid,
    } = admission;
    const guardianMode = admission.guardianMode;
    const parentid = guardianMode === 'existing' ? admission.parentid : undefined;
    const newGuardian = guardianMode === 'new' ? admission.newGuardian : undefined;

    if (guardianMode === 'existing' && parentid) {
      const parent = await prisma.parent.findUnique({ where: { id: parentid }, select: { id: true } });
      if (!parent) {
        return NextResponse.json({ error: 'Selected parent or guardian was not found' }, { status: 400 });
      }
    }

    const classData = await prisma.class.findUnique({
      where: { id: classid },
      select: { id: true, name: true, section: true, capacity: true, _count: { select: { students: true } } },
    });
    if (!classData) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    if (classData.section && classData.section.toLocaleUpperCase() !== section.toLocaleUpperCase()) {
      return NextResponse.json({ error: 'Selected class does not belong to the selected school section' }, { status: 400 });
    }

    const [hashedPassword, hashedGuardianPassword] = await Promise.all([
      bcrypt.hash(password, 12),
      guardianMode === 'new' && newGuardian ? bcrypt.hash(newGuardian.password, 12) : Promise.resolve(null),
    ]);

    // Read and allocate within the same transaction as the insert. If another
    // request wins the unique-index race, retry only that admission-number conflict.
    const maxAdmissionNumberAttempts = 5;
    let newStudent: Prisma.StudentGetPayload<{ select: typeof studentAdmissionResponseSelect }> | undefined;
    for (let attempt = 0; attempt < maxAdmissionNumberAttempts; attempt += 1) {
      try {
        newStudent = await prisma.$transaction(async (tx) => {
          const existingAdmissions = await tx.student.findMany({ select: { admissionnumber: true } });
          const admissionnumber = generateAdmissionNumber(
            existingAdmissions.map((student) => student.admissionnumber),
            new Date(),
            'HAB'
          );

          let linkedParentId = parentid;
          if (guardianMode === 'new' && newGuardian && hashedGuardianPassword) {
            const guardian = await tx.parent.create({
              data: {
                title: newGuardian.title,
                firstname: newGuardian.firstname,
                surname: newGuardian.surname,
                othername: newGuardian.othername,
                gender: newGuardian.gender,
                phone: newGuardian.phone,
                password: hashedGuardianPassword,
                active: true,
              },
              select: { id: true },
            });
            linkedParentId = guardian.id;
          }

          return tx.student.create({
            data: {
              admissionnumber,
              firstname,
              surname,
              othername,
              birthday,
              gender,
              religion,
              house,
              bloodgroup,
              admissiondate,
              section: classData.section ?? section,
              address,
              state,
              lga,
              avarta,
              password: hashedPassword,
              active,
              parentid: linkedParentId!,
              classid,
            },
            select: studentAdmissionResponseSelect,
          });
        });
        break;
      } catch (error) {
        if (!isAdmissionNumberConflict(error)) throw error;
        if (attempt === maxAdmissionNumberAttempts - 1) {
          return NextResponse.json(
            { error: 'Admission number allocation is temporarily busy. Please try again.' },
            { status: 503 }
          );
        }
      }
    }

    if (!newStudent) {
      return NextResponse.json({ error: 'Unable to allocate an admission number' }, { status: 503 });
    }

    return successResponse(newStudent, 201);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A guardian phone number or admission number already exists' }, { status: 409 });
    }
    return handleError(error, 'Failed to create student');
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER]);
    if (validation.error) return validation.error;
    const bodyValidation = await validateRequestBody(request, studentDeletionSchema);
    if (bodyValidation.error) return bodyValidation.error;
    const { reason } = bodyValidation.data!;

    const url = new URL(request.url);
    const ids = url.searchParams.getAll('ids');

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }
    if (ids.length > 100 || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Select up to 100 unique student records.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const students = await tx.student.findMany({
        where: { id: { in: ids } },
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
      if (students.length !== ids.length) throw new Error('STUDENT_NOT_FOUND');

      await tx.recordCorrection.createMany({
        data: students.map((student) => ({
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
        })),
      });

      return tx.student.deleteMany({ where: { id: { in: ids } } });
    });

    return successResponse({
      deleted: result.count,
      message: `Successfully deleted ${result.count} students`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'STUDENT_NOT_FOUND') {
      return NextResponse.json({ error: 'One or more student records were not found. Nothing was deleted.' }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'One or more students have linked school records and cannot be permanently deleted. Use the withdrawal or graduation workflow instead.' }, { status: 409 });
    }
    return handleError(error, 'Failed to delete students');
  }
}
