
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
    validateSession,
    validateRequestBody,
    handleError,
    successResponse,
    checkResourceExists,
    UserRole,
} from "@/lib/utils/api-helpers";

/**
 * Request body shape:
 * {
 *   userId: string,      // the id of the user whose password will be changed
 *   role: 'super'|'admin'|'teacher'|'student'|'parent',
 *   oldPassword?: string, // required when changing own password
 *   newPassword: string
 * }
 */
const changePasswordSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(["super", "admin", "teacher", "student", "parent"]),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export async function POST(request: NextRequest) {
    try {
        const validation = await validateSession();
        if (validation.error) return validation.error;

        const { session, userRole: sessionUserRole } = validation;

        // Validate request body
        const bodyValidation = await validateRequestBody(request, changePasswordSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { userId, role, oldPassword, newPassword } = bodyValidation.data as ChangePasswordBody;

        // Helper: select model based on role
        const getModel = (r: ChangePasswordBody["role"]) => {
            switch (r) {
                case "admin":
                case "super":
                    return { model: prisma.administration, name: "Administrator" };
                case "teacher":
                    return { model: prisma.teacher, name: "Teacher" };
                case "student":
                    return { model: prisma.student, name: "Student" };
                case "parent":
                    return { model: prisma.parent, name: "Parent" };
                default:
                    return null;
            }
        };

        const modelInfo = getModel(role);
        if (!modelInfo) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // If the requester is changing someone else's password, only allow elevated roles
        const isChangingOthers = session!.user.id !== userId;
        const elevatedRoles = [UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT];

        if (isChangingOthers && !elevatedRoles.includes(sessionUserRole)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Ensure resource exists
        const resourceCheck = await checkResourceExists(modelInfo.model, userId, `${modelInfo.name} not found`);
        if (resourceCheck.error) return resourceCheck.error;

        // Fetch current record (we need the hashed password when user is changing their own password)
        const current = await (modelInfo.model as any).findUnique({ where: { id: userId }, select: { id: true, password: true } });

        if (!current) {
            return NextResponse.json({ error: `${modelInfo.name} not found` }, { status: 404 });
        }

        // If user is changing their own password, oldPassword is required and must match
        if (!isChangingOthers) {
            if (!oldPassword) {
                return NextResponse.json({ error: "Old password is required", code: "missing_old_password" }, { status: 400 });
            }
            if (!current.password) {
                return NextResponse.json({ code: "invalid_old_password", message: "Old password is incorrect." }, { status: 401 });
            }
            const isValid = await bcrypt.compare(oldPassword, current.password);
            if (!isValid) {
                return NextResponse.json({ code: "invalid_old_password", message: "Old password is incorrect." }, { status: 401 });
            }
        } else {
            if (sessionUserRole !== UserRole.SUPER && role === "admin") {
                return NextResponse.json({ error: "Access denied to change administrator password" }, { status: 403 });
            }
        }

        // Hash new password and update appropriate model
        const hashed = await bcrypt.hash(newPassword, 12);

        // Build update payload and select fields to return
        const updateData: any = { password: hashed };
        const selectFields: any = { id: true, updatedAt: true };

        // Update and return friendly result
        const updated = await (modelInfo.model as any).update({
            where: { id: userId },
            data: updateData,
            select: selectFields,
        });

        return successResponse({ message: "Password changed successfully", data: updated });
    } catch (error) {
        return handleError(error, "Failed to change password");
    }
}
