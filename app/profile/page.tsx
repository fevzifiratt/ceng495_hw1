import {redirect} from 'next/navigation';
import {requireAuth} from '@/lib/auth';
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';

export default async function ProfilePage() {
    // Ensure user is authenticated - this function will redirect to login if not
    const user = await requireAuth();

    // Get the authenticated username
    const username = user.name;

    if (!username) {
        redirect('/login');
    }

    try {
        // Connect directly to MongoDB instead of using the API
        const client = await clientPromise;
        const db = client.db('CENG495-HW1');
        const userData = await db.collection('users').findOne({username});

        if (!userData) {
            throw new Error('User not found');
        }

        // Remove password from user data for safety
        const {password, ...userDataSafe} = userData;

        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Your personal information and
                                reviews</p>
                        </div>
                    </div>

                    {/* User Information */}
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Username</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userDataSafe.username}</dd>
                            </div>

                            {userDataSafe.email && (
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userDataSafe.email}</dd>
                                </div>
                            )}

                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Account type</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {userDataSafe.isAdmin ? 'Administrator' : 'Regular User'}
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
                                        {userDataSafe.averageRating ? userDataSafe.averageRating.toFixed(1) : 'N/A'}
                                        <span className="text-gray-500 ml-2">
                                            ({userDataSafe.reviewCount || 0} reviews)
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

                    {userDataSafe.itemReviews && userDataSafe.itemReviews.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg divide-y divide-gray-200">
                            {userDataSafe.itemReviews.map((review: any) => (
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
    } catch (error) {
        console.error("Error fetching profile data:", error);
        redirect('/error?message=Failed+to+load+profile');
    }
}