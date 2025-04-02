// app/admin/items/add/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddItemPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        seller: '',
        image: '',
        itemType: 'vinyl',
        // Type-specific fields
        age: '',
        material: '',
        batteryLife: '',
        size: ''
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
                <h1 className="text-2xl font-bold mb-4">Add New Item</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'seller', 'image', 'itemType'];
        for (const field of requiredFields) {
            if (!formData[field as keyof typeof formData]) {
                setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
                return;
            }
        }

        // Validate type-specific fields
        switch (formData.itemType) {
            case 'vinyl':
                if (!formData.age) {
                    setError('Age is required for vinyl records');
                    return;
                }
                break;
            case 'antiqueFurniture':
                if (!formData.age || !formData.material) {
                    setError('Age and material are required for antique furniture');
                    return;
                }
                break;
            case 'gpsWatch':
                if (!formData.batteryLife) {
                    setError('Battery life is required for GPS watches');
                    return;
                }
                break;
            case 'runningShoes':
                if (!formData.size || !formData.material) {
                    setError('Size and material are required for running shoes');
                    return;
                }
                break;
        }

        // Prepare data for API
        const itemData = {
            ...formData,
            price: parseFloat(formData.price),
            // Convert type-specific fields to numbers where applicable
            ...(formData.age && { age: parseInt(formData.age) }),
            ...(formData.batteryLife && { batteryLife: parseInt(formData.batteryLife) }),
            ...(formData.size && { size: parseFloat(formData.size) })
        };

        setIsLoading(true);

        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create item');
            }

            setSuccess(`Item "${formData.name}" created successfully`);
            // Reset form
            setFormData({
                name: '',
                description: '',
                price: '',
                seller: '',
                image: '',
                itemType: 'vinyl',
                age: '',
                material: '',
                batteryLife: '',
                size: ''
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
                <h1 className="text-3xl font-bold">Add New Item</h1>
                <div className="space-x-4">
                    <Link
                        href="/admin"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Name
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Price
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Seller
                                <input
                                    type="text"
                                    name="seller"
                                    value={formData.seller}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Item Type
                                <select
                                    name="itemType"
                                    value={formData.itemType}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                >
                                    <option value="vinyl">Vinyl Record</option>
                                    <option value="antiqueFurniture">Antique Furniture</option>
                                    <option value="gpsWatch">GPS Watch</option>
                                    <option value="runningShoes">Running Shoes</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Image URL
                                <input
                                    type="text"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            />
                        </label>
                    </div>

                    {/* Type-specific fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(formData.itemType === 'vinyl' || formData.itemType === 'antiqueFurniture') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Age (years)
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        min="0"
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    />
                                </label>
                            </div>
                        )}

                        {(formData.itemType === 'antiqueFurniture' || formData.itemType === 'runningShoes') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Material
                                    <input
                                        type="text"
                                        name="material"
                                        value={formData.material}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    />
                                </label>
                            </div>
                        )}

                        {formData.itemType === 'gpsWatch' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Battery Life (hours)
                                    <input
                                        type="number"
                                        name="batteryLife"
                                        value={formData.batteryLife}
                                        onChange={handleChange}
                                        min="0"
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    />
                                </label>
                            </div>
                        )}

                        {formData.itemType === 'runningShoes' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Size
                                    <input
                                        type="number"
                                        name="size"
                                        value={formData.size}
                                        onChange={handleChange}
                                        step="0.5"
                                        min="0"
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Item'}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/admin/items')}
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