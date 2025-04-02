// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Public routes - allow unauthenticated access to GET items, item details, and login
    if ((path.startsWith("/api/items") && method === "GET") ||
        path.startsWith("/items/") ||
        path.startsWith("/login") ||
        path === "/") {
        return NextResponse.next();
    }

    // For protected routes, check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Not authenticated for protected routes
    if (!token) {
        // Redirect to login for page routes
        if (!path.startsWith("/api/")) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        // Return 401 for API routes
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check admin routes
    const isAdminRoute =
        // DELETE operations
        (path === "/api/users" && method === "DELETE") ||
        (path === "/api/items" && method === "DELETE") ||
        // POST operations for items and users
        (path === "/api/items" && method === "POST") ||
        (path === "/api/users" && method === "POST") ||
        // Admin section
        path.startsWith("/admin");

    // Verify admin privileges
    if (isAdminRoute && token.isAdmin !== true) {
        if (!path.startsWith("/api/")) {
            // Redirect non-API admin routes to home
            return NextResponse.redirect(new URL("/", req.url));
        }
        // Return 403 for API routes
        return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    return NextResponse.next();
}

// Define which routes are handled by middleware
export const config = {
    matcher: [
        "/api/users/:path*",
        "/api/reviews/:path*",
        "/api/items/:path*",
        "/admin/:path*",
        "/profile/:path*",
        "/login",
        "/"
    ],
};