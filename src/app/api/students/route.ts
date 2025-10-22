import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { studentSchema } from '@/lib/schemas/index';
import { validateSession, validateRequestBody, handleError, successResponse, UserRole } from '@/lib/utils/api-helpers';
import bcrypt from 'bcryptjs';

/**
 * Generate a new admission number for a student.
 */
const generateAdmissionNumber = (
  existingAdmissions: string[] = [],
  currentDate = new Date(),
  prefix = "HAB"
) => {
  const yearStr = currentDate.getFullYear().toString();
  const safePrefix = prefix || "";
  const escapedPrefix = safePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedPrefix}/${yearStr}/(\\d{5})$`);
  const sequences = existingAdmissions.reduce((acc: number[], admission: string) => {
    const match = admission.match(regex);
    if (match) acc.push(parseInt(match[1], 10));
    return acc;
  }, []);
  const baseSequence = 1;
  const nextSequence = sequences.length === 0 ? baseSequence : Math.max(...sequences) + 1;
  const paddedSequence = nextSequence.toString().padStart(5, "0");
  return `${safePrefix}/${yearStr}/${paddedSequence}`;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER, UserRole.PARENT]);
    if (validation.error) return validation.error;

    const { userRole, session } = validation;
    const where: Prisma.StudentWhereInput = {};

    // Restrict access based on user role
    if (userRole === UserRole.TEACHER) {
      // Teachers see students in classes where they are form masters or have lessons
      where.class = {
        OR: [
          { formmasterid: session!.user.id },
          { lessons: { some: { teacherid: session!.user.id } } }
        ]
      };
    } else if (userRole === UserRole.PARENT) {
      // Parents see only their own children
      where.parentid = session!.user.id;
    }

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
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            category: true,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse({ data: students });
  } catch (error) {
    return handleError(error, 'Failed to fetch students');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
    if (validation.error) return validation.error;

    const bodyValidation = await validateRequestBody(request, studentSchema);
    if (bodyValidation.error) return bodyValidation.error;

    const { firstname, surname, othername, birthday, gender, religion, house, bloodgroup, admissiondate, /* email, phone, */ address, section, state, lga, avarta, password, active, parentid, classid } = bodyValidation.data!;

    // Validate parentid and classid
    const parent = await prisma.parent.findUnique({ where: { id: parentid } });
    if (!parent) {
      return NextResponse.json({ error: 'Invalid parent ID' }, { status: 400 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classid },
      select: { id: true, capacity: true, _count: { select: { students: true } } }
    });
    if (!classData) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    // Check class capacity
    if (classData.capacity && classData._count.students >= classData.capacity) {
      return NextResponse.json({ error: 'Class capacity exceeded' }, { status: 400 });
    }

    // Generate admission number
    const existingAdmissions = await prisma.student.findMany({
      select: { admissionnumber: true }
    });
    const admissionNumbers: string[] = existingAdmissions
      .map((s) => s.admissionnumber)
      .filter((n): n is string => !!n);
    const admissionnumber = generateAdmissionNumber(admissionNumbers, new Date(), "HAB");

    // Check if email or phone already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { admissionnumber },
        ]
      }
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          error:
            existingStudent.admissionnumber === admissionnumber ? 'Admission number already exists' :
              'Phone already exists'
        },
        { status: 409 }
      );
    }

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const newStudent = await prisma.student.create({
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
        section,
        /*    email,
           phone, */
        address,
        state,
        lga,
        avarta,
        password: hashedPassword,
        active,
        parentid,
        classid
      },
      select: {
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
            firstname: true,
            surname: true,
            othername: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    return successResponse(newStudent, 201);
  } catch (error) {
    return handleError(error, 'Failed to create student');
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateSession([UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TEACHER]);
    if (validation.error) return validation.error;

    const url = new URL(request.url);
    const ids = url.searchParams.getAll('ids');

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const result = await prisma.student.deleteMany({
      where: { id: { in: ids } }
    });

    return successResponse({
      deleted: result.count,
      message: `Successfully deleted ${result.count} students`
    });
  } catch (error) {
    return handleError(error, 'Failed to delete students');
  }
}