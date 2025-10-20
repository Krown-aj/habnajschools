import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            userType: string,
            section: string?
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        userType: string,
        section: string?
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
    }
}