// app/admin/users/add/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddUserPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        isAdmin: false
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check if user is admin
    if (status === 'authenticated' && !session?.user?.isAdmin) {
        router.push('/');
        return null;
    }

    // Show loading or login prompt if no session
    if (status === 'loading') {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Add New User</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create user');
            }

            setSuccess(`User ${formData.username} created successfully`);
            setFormData({
                username: '',
                password: '',
                isAdmin: false
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Add New User</h1>
                <div className="space-x-4">
                    <Link
                        href="/admin"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    >
                        Back to Admin
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Username
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                autoComplete="off"
                            />
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                autoComplete="new-password"
                            />
                        </label>
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isAdmin"
                                checked={formData.isAdmin}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Grant Admin Privileges</span>
                        </label>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create User'}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/admin/users')}
                            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}