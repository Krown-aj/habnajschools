import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import prisma from "./prisma";
import { checkRateLimit } from "./rate-limit";

const passwordVersion = (passwordHash: string | null) =>
    createHash("sha256").update(passwordHash ?? "").digest("hex");
const SESSION_VERSION = 2;

async function getAccountSessionState(userType: string, id: string) {
    switch (userType) {
        case "admin":
            return prisma.administration.findUnique({
                where: { id },
                select: { active: true, role: true, password: true },
            });
        case "teacher":
            return prisma.teacher.findUnique({ where: { id }, select: { active: true, password: true } });
        case "student":
            return prisma.student.findUnique({ where: { id }, select: { active: true, password: true } });
        case "parent":
            return prisma.parent.findUnique({ where: { id }, select: { active: true, password: true } });
        default:
            return null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },

            // note the second param `req` to match the declared type
            async authorize(credentials, req): Promise<User | null> {
                const { username, password } = credentials ?? {};
                if (!username || !password) {
                    throw new Error("invalid_credentials");
                }

                const forwardedFor = req.headers?.["x-forwarded-for"];
                const realIp = req.headers?.["x-real-ip"];
                const clientIp = String(
                    realIp ?? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0] ?? "unknown"
                ).trim();
                const normalizedUsername = username.trim().toLocaleLowerCase();
                const [ipLimit, accountLimit] = await Promise.all([
                    checkRateLimit("signin-ip", clientIp, 20, 10 * 60),
                    checkRateLimit("signin-account", normalizedUsername, 10, 10 * 60),
                ]);

                if (
                    (!ipLimit.success && ipLimit.reason === "unavailable") ||
                    (!accountLimit.success && accountLimit.reason === "unavailable")
                ) {
                    throw new Error("server_error");
                }
                if (!ipLimit.success || !accountLimit.success) {
                    throw new Error("rate_limited");
                }

                try {
                    // Admin
                    const admin = await prisma.administration.findUnique({
                        where: { email: username },
                    });
                    if (admin) {
                        if (!admin.active) {
                            throw new Error("invalid_credentials");
                        }
                        if (admin.password) {
                            const isValid = await bcrypt.compare(password, admin.password);
                            if (isValid) {
                                return {
                                    id: String(admin.id),
                                    email: admin.email,
                                    name: admin.email,
                                    role: String(admin.role).toLowerCase(),
                                    userType: "admin",
                                    authVersion: passwordVersion(admin.password),
                                } as unknown as User;
                            } else {
                                // wrong password
                                throw new Error("invalid_credentials");
                            }
                        }
                    }

                    // Teacher
                    const teacher = await prisma.teacher.findUnique({ where: { email: username } });
                    if (teacher) {
                        if (!teacher.active) {
                            throw new Error("invalid_credentials");
                        }
                        if (teacher.password) {
                            const isValid = await bcrypt.compare(password, teacher.password);
                            if (isValid) {
                                return {
                                    id: String(teacher.id),
                                    email: teacher.email,
                                    name: `${teacher.firstname ?? ""} ${teacher.surname ?? ""} ${teacher.othername ?? ""}`.trim(),
                                    role: "teacher",
                                    userType: "teacher",
                                    section: teacher.section,
                                    authVersion: passwordVersion(teacher.password),
                                } as unknown as User;
                            } else {
                                throw new Error("invalid_credentials");
                            }
                        }
                    }

                    // Student (username is admissionnumber)
                    const student = await prisma.student.findUnique({ where: { admissionnumber: username } });
                    if (student) {
                        if (!student.active) {
                            throw new Error("invalid_credentials");
                        }
                        if (student.password) {
                            const isValid = await bcrypt.compare(password, student.password);
                            if (isValid && student.admissionnumber) {
                                return {
                                    id: String(student.id),
                                    email: student.email,
                                    name: `${student.firstname ?? ""} ${student.surname ?? ""} ${student.othername ?? ""}`.trim(),
                                    role: "student",
                                    userType: "student",
                                    admissionNumber: student.admissionnumber,
                                    section: student.section,
                                    authVersion: passwordVersion(student.password),
                                } as unknown as User;
                            } else {
                                throw new Error("invalid_credentials");
                            }
                        }
                    }

                    // Parent (username is phone)
                    const parent = await prisma.parent.findUnique({ where: { phone: username } });
                    if (parent) {
                        if (!parent.active) {
                            throw new Error("invalid_credentials");
                        }
                        if (parent.password) {
                            const isValid = await bcrypt.compare(password, parent.password);
                            if (isValid) {
                                return {
                                    id: String(parent.id),
                                    email: parent.email,
                                    name: `${parent.firstname ?? ""} ${parent.surname ?? ""} ${parent.othername ?? ""}`.trim(),
                                    role: "parent",
                                    userType: "parent",
                                    authVersion: passwordVersion(parent.password),
                                } as unknown as User;
                            } else {
                                throw new Error("invalid_credentials");
                            }
                        }
                    }

                    // If we reached here, user not found
                    throw new Error("invalid_credentials");
                } catch (err: any) {
                    // Prisma or unexpected error: map to server_error so client shows a generic server message
                    if (err instanceof Error && err.message === "invalid_credentials") {
                        // rethrow known codes so client can handle them
                        throw err;
                    }
                    if (err instanceof Error && (err.message === "rate_limited" || err.message === "server_error")) {
                        throw err;
                    }

                    console.error("Authorize error:", err);
                    throw new Error("server_error");
                }
            },
        }),
    ],

    session: { strategy: "jwt", maxAge: 8 * 60 * 60 },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.userType = (user as any).userType;
                token.authVersion = (user as any).authVersion;
                token.sessionVersion = SESSION_VERSION;
            } else if (token.sessionVersion !== SESSION_VERSION) {
                // Invalidate tokens issued before account-state revalidation was added.
                token.invalid = true;
            } else if (token.sub && token.userType && !token.invalid) {
                const account = await getAccountSessionState(String(token.userType), token.sub);
                if (
                    !account ||
                    !account.active ||
                    (token.authVersion !== undefined && token.authVersion !== passwordVersion(account.password)) ||
                    ("role" in account && String(account.role).toLowerCase() !== String(token.role).toLowerCase())
                ) {
                    token.invalid = true;
                } else if (token.authVersion === undefined) {
                    // Keep previously issued active sessions valid once, then version them.
                    token.authVersion = passwordVersion(account.password);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token.invalid) {
                (session as any).user = null;
                return session;
            }
            if (token) {
                session.user.id = token.sub!;
                session.user.role = token.role as string;
                session.user.userType = token.userType as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
};
