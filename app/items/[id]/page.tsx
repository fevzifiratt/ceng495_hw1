// app/items/[id]/page.tsx
import { Suspense } from 'react';
import ItemDetails from './ItemDetails';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface ItemParams {
    params: Promise<{
        id: string;
    }>
}

// Dynamically generate metadata
export async function generateMetadata(
    params: ItemParams
): Promise<Metadata> {
    try {
        const item = await getItem((await params.params).id);

        if (!item) {
            return {
                title: 'Item Not Found',
                description: 'The requested item could not be found'
            };
        }

        return {
            title: `${item.name} | Vintage Marketplace`,
            description: item.description,
            openGraph: {
                title: item.name,
                description: item.description,
                images: [item.image]
            }
        };
    } catch (error) {
        return {
            title: 'Item Details',
            description: 'View item details'
        };
    }
}

// Define the Item type for server component
interface Item {
    _id: ObjectId;
    name: string;
    description: string;
    price: number;
    seller: string;
    image: string;
    itemType: string;
    rating: number;
    reviews: Array<{
        _id: string;
        username: string;
        rating: number;
        comment: string;
    }>;
    reviewCount: number;
    age?: number;
    material?: string;
    batteryLife?: number;
    size?: number;
}

// Server-side data fetching
async function getItem(id: string): Promise<Item | null> {
    try {
        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return null;
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Find the item by ID and type it properly
        const item = await db.collection('items').findOne<Item>({ _id: new ObjectId(id) });
        return item;
    } catch (error) {
        console.error('Error fetching item:', error);
        throw new Error('Failed to fetch item');
    }
}

export default async function ItemPage(params: ItemParams) {
    const item = await getItem((await params.params).id);

    if (!item) {
        notFound();
    }

    // Convert the MongoDB ObjectId to a string for the client component
    const itemForClient = {
        ...item,
        _id: item._id.toString()
    };

    return (
        <Suspense fallback={<div className="container mx-auto p-4 text-center">Loading item details...</div>}>
            <ItemDetails initialItem={itemForClient} id={(await params.params).id} />
        </Suspense>
    );
}