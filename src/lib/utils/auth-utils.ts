import { UserRole } from './api-helpers';
import prisma from '@/lib/prisma';

export async function getAccessibleResourceIds(
    userRole: UserRole,
    userId: string,
    resourceType: string
): Promise<string[]> {
    try {
        switch (userRole) {
            case UserRole.SUPER:
                return []; // Super admin has access to all resources

            case UserRole.ADMIN:
            case UserRole.MANAGEMENT:
                // For admin roles, has access to all resources
                return [];

            case UserRole.TEACHER:
                if (resourceType === 'classes') {
                    const teacher = await prisma.teacher.findUnique({
                        where: { id: userId },
                        select: { classes: { select: { id: true } } }
                    });
                    return teacher?.classes.map(c => c.id) || [];
                }
                return [];

            case UserRole.STUDENT:
                if (resourceType === 'classes') {
                    const student = await prisma.student.findUnique({
                        where: { id: userId },
                        select: { classid: true }
                    });
                    return student?.classid ? [student.classid] : [];
                }
                return [];

            case UserRole.PARENT:
                if (resourceType === 'classes') {
                    const children = await prisma.student.findMany({
                        where: { parentid: userId },
                        select: { classid: true }
                    });
                    return children.map(c => c.classid);
                }
                return [];

            default:
                return [];
        }
    } catch (error) {
        console.error('Error getting accessible resource IDs:', error);
        return [];
    }
}