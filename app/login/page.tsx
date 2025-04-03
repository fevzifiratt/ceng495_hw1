'use client';

import { FormEvent, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Component to handle search params inside Suspense boundary
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handle form submission for login
     * Uses NextAuth's signIn function to authenticate
     */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Call NextAuth's signIn function with credentials provider
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
                callbackUrl
            });

            // Handle authentication error
            if (result?.error) {
                setError('Invalid username or password');
                setIsLoading(false);
                return;
            }

            // Successful login, redirect to callbackUrl or home
            router.push(callbackUrl);
            router.refresh(); // Refresh to update the auth state in the UI
        } catch (error) {
            setError('An error occurred during login');
            console.error('Login error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-md">
            <div>
                <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    Sign in to your account
                </h1>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your credentials to access your account
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                    <p>{error}</p>
                </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4 rounded-md shadow-sm">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// Loading fallback for Suspense
function LoadingFallback() {
    return (
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                    <div className="h-10 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                    <div className="h-10 bg-gray-200 rounded mb-6"></div>
                    <div className="h-10 bg-indigo-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <Suspense fallback={<LoadingFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}