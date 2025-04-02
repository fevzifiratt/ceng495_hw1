// app/items/[id]/ItemDetails.tsx
'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import Image from 'next/image';

interface Review {
    _id: string;
    username: string;
    rating: number;
    comment: string;
}

interface Item {
    _id: string | { toString(): string };
    name: string;
    description: string;
    price: number;
    seller: string;
    image: string;
    itemType: string;
    rating: number;
    reviews: Review[];
    reviewCount: number;
    // Type-specific fields
    age?: number;
    material?: string;
    batteryLife?: number;
    size?: number;
}

interface ItemDetailsProps {
    initialItem: Item;
    id: string;
}

export default function ItemDetails({ initialItem, id }: ItemDetailsProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [item, setItem] = useState<Item>(initialItem);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    

    // Format item type for display
    const formatItemType = (type: string): string => {
        switch(type) {
            case 'antiqueFurniture':
                return 'Antique Furniture';
            case 'gpsWatch':
                return 'GPS Watch';
            case 'runningShoes':
                return 'Running Shoes';
            case 'vinyl':
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    // Handle review submission
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.name) {
            console.log("No session found - redirecting to login");
            router.push('/login');
            return;
        }

        try {
            setSubmitting(true);
            setSubmitError(null);

            console.log("Submitting review with session:", session.user.name);

            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    itemId: id,
                    username: session.user.name,
                    rating: newReview.rating,
                    comment: newReview.comment
                }),
            });

            const data = await response.json();
            console.log("Response data:", data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit review');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit review');
            }

            // Refresh item details to show the new review
            const itemResponse = await fetch(`/api/items/${id}`);
            const itemData = await itemResponse.json();
            setItem(itemData.item);

            // Reset form
            setNewReview({ rating: 5, comment: '' });
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-6">
                <Link href="/" className="text-indigo-600 hover:underline">
                    ← Back to items
                </Link>
            </div>

            {/* White box container for item details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left column: Image */}
                    <div className="md:w-1/2">
                        <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <Link href={item.image} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Right column: Item details */}
                    <div className="md:w-1/2">
                        <h1 className="text-3xl font-bold mb-2 text-gray-900">{item.name}</h1>
                        <span className={`px-2 inline-flex text-xl leading-9 font-semibold rounded-full ${
                            item.itemType === 'vinyl'
                                ? 'bg-purple-100 text-purple-800'
                                : item.itemType === 'antiqueFurniture'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.itemType === 'gpsWatch'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                        }`}>
                            {formatItemType(item.itemType)}
                            </span>
                        <div className="flex items-center mb-4">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                    <svg
                                        key={star}
                                        className={`w-5 h-5 ${
                                            star <= item.rating
                                                ? 'text-amber-500'
                                                : 'text-gray-300'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="ml-2 text-gray-600">
                  {item.rating.toFixed(1)} ({item.reviewCount} reviews)
                </span>
                        </div>

                        <div className="text-2xl font-bold text-purple-700 mb-4">
                            ${item.price.toFixed(2)}
                        </div>

                        <div className="mb-4">
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">Description</h2>
                            <p className="text-gray-600">{item.description}</p>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">Seller</h2>
                            <p className="text-gray-600">{item.seller}</p>
                        </div>

                        {/* Type-specific details */}
                        {item.itemType === 'vinyl' && (
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold mb-2 text-gray-800">Age</h2>
                                <p className="text-gray-600">{item.age} years</p>
                            </div>
                        )}

                        {item.itemType === 'antiqueFurniture' && (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Age</h2>
                                    <p className="text-gray-600">{item.age} years</p>
                                </div>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Material</h2>
                                    <p className="text-gray-600">{item.material}</p>
                                </div>
                            </>
                        )}

                        {item.itemType === 'gpsWatch' && (
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold mb-2 text-gray-800">Battery Life</h2>
                                <p className="text-gray-600">{item.batteryLife} hours</p>
                            </div>
                        )}

                        {item.itemType === 'runningShoes' && (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Size</h2>
                                    <p className="text-gray-600">{item.size}</p>
                                </div>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Material</h2>
                                    <p className="text-gray-600">{item.material}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews section */}
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Reviews</h2>

                {/* Review submission form */}
                {session?.user?.name && (
                    <div className="bg-green-800 border border-green-200 p-6 rounded-lg mb-8">
                        <h3 className="text-xl font-semibold mb-4 text-gray-300">Rate & Comment</h3>

                        {submitError && (
                            <div className="bg-rose-100 border-l-4 border-rose-500 text-rose-700 p-4 mb-4">
                                <p>{submitError}</p>
                            </div>
                        )}

                        <form onSubmit={handleReviewSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2" htmlFor="rating">
                                    Rating (1-10)
                                </label>
                                <select
                                    id="rating"
                                    value={newReview.rating}
                                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                                    className="w-full border rounded-md px-3 py-2 text-gray-300"
                                    required
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                        <option key={value} value={value} className="text-black">
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2" htmlFor="comment">
                                    Comment
                                </label>
                                <textarea
                                    id="comment"
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 min-h-[100px] text-gray-300"

                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Login prompt if not logged in */}
                {!session?.user && (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
                        <p className="mb-4 text-gray-700">Please log in to leave a review.</p>
                        <Link
                            href="/login"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Log In
                        </Link>
                    </div>
                )}

                {/* Display existing reviews */}
                {item.reviews && item.reviews.length > 0 ? (
                    <div className="space-y-6">
                        {item.reviews.map((review) => (
                            <div key={review._id} className="border-b pb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-indigo-600 text-xl">
                                        {review.username}
                                    </div>
                                    <div className="flex items-center text-xl">
                                        <span className="text-amber-500 mr-1">★</span>
                                        <span className="text-black">{review.rating}/10</span>
                                    </div>
                                </div>
                                <p className="text-black text-xl">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No reviews yet.</p>
                )}
            </div>
        </div>
    );
}