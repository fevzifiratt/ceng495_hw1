'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Item = {
    _id: string;
    name: string;
    description: string;
    price: number;
    seller: string;
    itemType: string;
    rating: number;
    reviewCount: number;
    image: string;
};

export default function AdminItemsPage() {
    const [items, setItems] = useState<Item[]>([]);
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

            fetchItems();
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, session, router]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/items');

            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }

            const data = await response.json();
            setItems(data.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the item: ${name}?`)) {
            try {
                const response = await fetch(`/api/items/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete item');
                }

                // Refresh the items list
                fetchItems();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            }
        }
    };

    const formatItemType = (type: string) => {
        if (type === 'antiqueFurniture') return 'Antique Furniture';
        if (type === 'gpsWatch') return 'GPS Watch';
        if (type === 'runningShoes') return 'Running Shoes';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    if (status === 'loading' || (status === 'authenticated' && loading)) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin: Item Management</h1>
                <div className="flex justify-center items-center h-64">
                    <p className="text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin: Item Management</h1>
                <div className="space-x-4">
                    <Link href="/admin/items/add" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Add New Item
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
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Seller
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Rating
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                            Delete
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-300">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 relative">
                                        <img
                                            className="h-10 w-10 rounded-full object-cover"
                                            src={item.image || '/placeholder-image.jpg'}
                                            alt=""
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/file.svg';
                                                (e.target as HTMLImageElement).onerror = null;
                                            }}
                                        />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-base font-medium text-black">{item.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base text-black">${item.price.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base text-black">{item.seller}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base text-black">
                                    {item.rating.toFixed(1)} ({item.reviewCount} reviews)
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => handleDeleteItem(item._id, item.name)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {items.length === 0 && !loading && (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center">
                                No items found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}