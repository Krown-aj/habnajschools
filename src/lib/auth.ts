import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

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

                try {
                    // Admin
                    const admin = await prisma.administration.findUnique({
                        where: { email: username },
                    });
                    if (admin) {
                        if (!admin.active) {
                            throw new Error("inactive");
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
                            throw new Error("inactive");
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
                            throw new Error("inactive");
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
                            throw new Error("inactive");
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
                    if (err instanceof Error && ["inactive", "invalid_credentials"].includes(err.message)) {
                        // rethrow known codes so client can handle them
                        throw err;
                    }

                    console.error("Authorize error:", err);
                    throw new Error("server_error");
                }
            },
        }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.userType = (user as any).userType;
            }
            return token;
        },
        async session({ session, token }) {
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
