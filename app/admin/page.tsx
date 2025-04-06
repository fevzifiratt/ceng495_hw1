// app/admin/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Check if user is admin
    if (status === 'authenticated' && !session?.user?.isAdmin) {
        router.push('/');
        return null;
    }

    // Show loading or login prompt if no session
    if (status === 'loading') {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Users Management Card */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-purple-600 p-4">
                        <h2 className="text-xl font-bold text-white">User Management</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-700 mb-6">
                            View and delete user accounts. Monitor user activity and ratings.
                        </p>
                        <div className="flex space-x-4">
                            <Link
                                href="/admin/users"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                            >
                                Manage Users
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Items Management Card */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-blue-600 p-4">
                        <h2 className="text-xl font-bold text-white">Item Management</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-700 mb-6">
                            Manage product inventory. View and remove products.
                        </p>
                        <div className="flex space-x-4">
                            <Link
                                href="/admin/items"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                Manage Items
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}