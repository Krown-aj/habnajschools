import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // API handlers own authentication and authorization so they can return
        // their established JSON 401/403 responses. Add an Origin check for
        // browser mutations as defense in depth against cross-site requests.
        if (pathname.startsWith("/api/")) {
            const isNextAuthProtocol = pathname.startsWith("/api/auth/") && pathname !== "/api/auth/change-password";
            const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
            if (!isNextAuthProtocol && isMutation) {
                const origin = req.headers.get("origin");
                if (origin) {
                    try {
                        if (new URL(origin).origin !== req.nextUrl.origin) {
                            return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
                        }
                    } catch {
                        return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
                    }
                }
            }
            return NextResponse.next();
        }

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

                // API routes perform their own session and role checks.
                if (pathname.startsWith("/api/")) return true;

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
                return !!token && !token.invalid && token.sessionVersion === 2;
            },
        },
    }
);

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|assets).*)",
    ],
};
