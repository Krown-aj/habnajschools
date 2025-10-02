import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                admissionNumber: { label: "Admission Number", type: "text" },
            },

            // note the second param `req` to match the declared type
            async authorize(credentials, req): Promise<User | null> {
                const { email, admissionNumber, password } = credentials ?? {};

                if ((!email && !admissionNumber) || !password) {
                    return null;
                }

                // Admin
                const admin = await prisma.administration.findUnique({
                    where: { email },
                });
                if (admin && admin.email && admin.password && admin.active) {
                    const isValid = await bcrypt.compare(password, admin.password);
                    if (isValid) {
                        return {
                            id: admin.id,
                            email: admin.email,
                            name: admin.email,
                            role: admin.role.toLowerCase(),
                            userType: "admin",
                        } as unknown as User;
                    }
                }

                // Teacher
                const teacher = await prisma.teacher.findUnique({ where: { email } });
                if (teacher && teacher.email && teacher.password && teacher.active) {
                    const isValid = await bcrypt.compare(password, teacher.password);
                    if (isValid) {
                        return {
                            id: teacher.id,
                            email: teacher.email,
                            name: `${teacher.firstname ?? ""} ${teacher.surname ?? ""} ${teacher.othername ?? ""}`.trim(),
                            role: "teacher",
                            userType: "teacher",
                        } as unknown as User;
                    }
                }

                // Student
                const student = await prisma.student.findUnique({ where: { email } });
                if (student && student.email && student.password && student.active) {
                    const isValid = await bcrypt.compare(password, student.password);
                    if (isValid && student.admissionnumber) {
                        return {
                            id: student.id,
                            email: student.email,
                            name: `${student.firstname ?? ""} ${student.surname ?? ""} ${student.othername ?? ""}`.trim(),
                            role: "student",
                            userType: "student",
                            admissionNumber: student.admissionnumber,
                        } as unknown as User;
                    }
                }

                // Parent
                const parent = await prisma.parent.findUnique({ where: { email } });
                if (parent && parent.email && parent.password && parent.active) {
                    const isValid = await bcrypt.compare(password, parent.password);
                    if (isValid) {
                        return {
                            id: parent.id,
                            email: parent.email,
                            name: `${parent.firstname ?? ""} ${parent.surname ?? ""} ${parent.othername ?? ""}`.trim(),
                            role: "parent",
                            userType: "parent",
                        } as unknown as User;
                    }
                }

                return null;
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
