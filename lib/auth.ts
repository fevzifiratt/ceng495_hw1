// // lib/auth.ts
// import { getServerSession } from "next-auth/next";
// import { redirect } from "next/navigation";
//
// export async function getSession() {
//     return await getServerSession();
// }
//
// export async function getCurrentUser() {
//     const session = await getSession();
//     return session?.user;
// }
//
// export async function requireAuth() {
//     const user = await getCurrentUser();
//
//     if (!user) {
//         redirect("/login");
//     }
//
//     return user;
// }
//
// export async function requireAdmin() {
//     const user = await getCurrentUser();
//
//     if (!user) {
//         redirect("/login");
//     }
//
//     if (user.isAdmin !== true) {
//         redirect("/unauthorized");
//     }
//
//     return user;
// }

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

/**
 * Get the current session on the server side
 * Use this in Server Components to access authentication state
 */
export async function getSession() {
    return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user on the server side
 * Returns user object or undefined if not authenticated
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user;
}

/**
 * Server-side function to require authentication
 * Redirects to login if not authenticated
 * Returns the user object if authenticated
 */
export async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return user;
}

/**
 * Server-side function to require admin privileges
 * Redirects to login if not authenticated
 * Redirects to unauthorized page if authenticated but not admin
 * Returns the user object if authenticated and admin
 */
export async function requireAdmin() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    if (user.isAdmin !== true) {
        redirect("/unauthorized");
    }

    return user;
}

/**
 * Check if the current user has admin privileges
 * Returns boolean indicating admin status
 */
export async function isAdmin() {
    const user = await getCurrentUser();
    return user?.isAdmin === true;
}