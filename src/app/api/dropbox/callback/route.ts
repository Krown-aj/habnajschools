import { NextResponse } from "next/server";

/**
 * The former callback reflected OAuth authorization codes into the response.
 * It had no state validation and no safe server-side token storage, so it is
 * intentionally disabled until a complete OAuth callback flow is implemented.
 */
export async function GET() {
    return NextResponse.json(
        { error: "Dropbox authorization setup is unavailable through this endpoint" },
        {
            status: 410,
            headers: {
                "Cache-Control": "no-store",
                "Referrer-Policy": "no-referrer",
            },
        }
    );
}
