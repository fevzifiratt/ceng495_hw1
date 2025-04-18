'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Define TypeScript interfaces for our data
interface Review {
    _id: string;
    itemId: string;
    itemName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface UserData {
    _id?: string;
    username: string;
    email?: string;
    isAdmin: boolean;
    averageRating: number;
    reviewCount: number;
    itemReviews: Review[];
}

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Check if the user is authenticated
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        // Only fetch data if we have a session
        if (status === 'authenticated' && session?.user?.name) {
            const username = session.user.name;

            async function fetchUserData() {
                try {
                    const response = await fetch(`/api/users/${username}`, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch user data: ${response.status}`);
                    }

                    const data = await response.json();
                    // Log the response to see its structure
                    console.log('API Response:', data);
                    setUserData(data);
                    setLoading(false);
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setError(err instanceof Error ? err : new Error('An unknown error occurred'));
                    setLoading(false);
                }
            }

            fetchUserData();
        }
    }, [session, status, router]);

    // Show loading state
    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                    </div>
                    <p className="mt-2 text-gray-500">Loading your profile...</p>
                </div>
            </main>
        );
    }

    // Show error state
    if (error) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                Error loading profile data. Please try again later.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Show profile if data is loaded
    // Debug log to check userData structure
    console.log('Current userData state:', userData);

    if (userData) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                        </div>
                    </div>

                    {/* User Information */}
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Username</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData.username}</dd>
                            </div>

                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Account type</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {userData.isAdmin ? 'Administrator' : 'Regular User'}
                                </dd>
                            </div>

                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Average review rating</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                  <span className="flex items-center">
                    <svg
                        className="w-5 h-5 text-yellow-400 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                      <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                      {userData.averageRating ? userData.averageRating.toFixed(1) : 'N/A'}
                      <span className="text-gray-500 ml-2">
                      ({userData.reviewCount || 0} reviews)
                    </span>
                  </span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* User's Reviews */}
                <div className="mt-10">
                    <h2 className="text-2xl font-bold text-white mb-5">Your Reviews</h2>

                    {userData.itemReviews && userData.itemReviews.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg divide-y divide-gray-200">
                            {userData.itemReviews.map((review) => (
                                <div key={review._id} className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                <Link
                                                    href={`/items/${review.itemId}`}
                                                    className="hover:text-indigo-600"
                                                >
                                                    {review.itemName}
                                                </Link>
                                            </h3>
                                            <div className="flex items-center mb-3">
                                                <div className="flex">
                                                    {[...Array(10)].map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            className={`w-4 h-4 ${
                                                                i < review.rating
                                                                    ? 'text-yellow-400'
                                                                    : 'text-gray-300'
                                                            }`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-600 ml-2">
                          {review.rating}/10
                        </span>
                                            </div>
                                            <p className="text-gray-700">{review.comment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <p className="text-gray-500">You haven't written any reviews yet.</p>
                            <Link
                                href="/items"
                                className="inline-block mt-3 text-indigo-600 hover:text-indigo-800"
                            >
                                Browse items to review
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // Fallback if none of the above conditions are met
    return null;
}