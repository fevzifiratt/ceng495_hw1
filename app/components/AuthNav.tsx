'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function AuthNav() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="space-x-4">
                <Link href="/" className="hover:underline">Home</Link>
                <span className="opacity-70">Loading...</span>
            </div>
        );
    }

    if (!session) {
        // Not logged in
        return (
            <div className="space-x-4">
                <Link href="/" className="hover:underline">Home</Link>
                <Link href="/login" className="hover:underline">Login</Link>
            </div>
        );
    }

    // Logged in
    return (
        <div className="space-x-4 flex items-center">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
            {session.user.isAdmin && (
                <>
                    <Link href="/admin" className="hover:underline">Admin</Link>
                </>
            )}
            <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hover:underline text-white bg-transparent border-none cursor-pointer"
            >
                Logout
            </button>
            <span className="ml-4 font-medium">
                Hi, {session.user.name || 'User'}
            </span>
        </div>
    );
}