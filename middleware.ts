import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // Redirect /signin or /login to /auth/signin
        if (pathname === "/signin" || pathname === "/login") {
            return NextResponse.redirect(new URL("/auth/signin", req.url));
        }

        // Role-based access
        const roleRoutes = {
            super: ["/dashboard/super"],
            admin: ["/dashboard/admin"],
            chashier: ["/dashboard/chashier"],
            teacher: ["/dashboard/teacher"],
            student: ["/dashboard/student"],
            parent: ["/dashboard/parent"],
        };

        for (const [role, routes] of Object.entries(roleRoutes)) {
            for (const route of routes) {
                if (pathname.startsWith(route) && token?.role !== role) {
                    return NextResponse.redirect(
                        new URL(token?.role ? `/dashboard/${token.role}` : '/auth/signin', req.url)
                    );
                }
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Allow public routes
                if (
                    pathname === "/" ||
                    pathname.startsWith("/auth/") ||
                    pathname === "/signin" ||
                    pathname === "/login"
                ) {
                    return true;
                }

                // Require authentication for all other routes
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
    ],
};
