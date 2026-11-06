import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    // Middleware does not cover API routes; do not expose a Dropbox bearer token
    // to anonymous visitors.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN } = process.env;
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !DROPBOX_REFRESH_TOKEN) {
        console.error("Dropbox env vars missing");
        return NextResponse.json({ error: "Dropbox env vars not set" }, { status: 500 });
    }

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: DROPBOX_REFRESH_TOKEN,
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
    });

    let tokenRes: Response;
    try {
        tokenRes = await fetch("https://api.dropbox.com/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });
    } catch (networkErr) {
        console.error("Network error refreshing Dropbox token:", networkErr);
        return NextResponse.json({ error: "Network error" }, { status: 500 });
    }

    const json = await tokenRes.json();
    if (!tokenRes.ok) {
        console.error("Dropbox token refresh error:", json);
        return NextResponse.json(
            { error: json.error_description || json.error || "Refresh failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({ access_token: json.access_token });
}
