'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
    _id: string;
    username: string;
    isAdmin: boolean;
    averageRating: number;
    reviewCount: number;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Check if user is admin
        if (status === 'authenticated') {
            if (!session?.user?.isAdmin) {
                router.push('/');
                return;
            }

            fetchUsers();
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (username: string) => {
        if (window.confirm(`Are you sure you want to delete the user: ${username}?`)) {
            try {
                const response = await fetch(`/api/users/${username}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }

                // Refresh the user list
                fetchUsers();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            }
        }
    };

    if (status === 'loading' || (status === 'authenticated' && loading)) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin: User Management</h1>
                <div className="flex justify-center items-center h-64">
                    <p className="text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin: User Management</h1>
                <div className="space-x-4">
                    <Link href="/admin/users/add" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Add New User
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-500 text-white p-4 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800 text-white">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Username
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Average Rating
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Review Count
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-300">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base font-medium text-black">{user.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base text-black">{user.averageRating?.toFixed(1) || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base text-black">{user.reviewCount || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                <button
                                    onClick={() => handleDeleteUser(user.username)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}

                    {users.length === 0 && !loading && (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center">
                                No users found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}