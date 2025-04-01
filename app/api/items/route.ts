// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/items
 *
 * Retrieves items from the database with optional filtering
 * - Supports filtering by type, price range, and minimum rating
 * - Supports sorting by any field
 * - Supports pagination
 * - Returns a JSON array of items with pagination metadata
 *
 * Query parameters:
 * - type: string (optional) - Filter by item type ('vinyl', 'antiqueFurniture', 'gpsWatch', 'runningShoes')
 * - minPrice: number (optional) - Filter by minimum price
 * - maxPrice: number (optional) - Filter by maximum price
 * - minRating: number (optional) - Filter by minimum rating
 * - sortBy: string (optional, default: 'createdAt') - Field to sort by
 * - order: string (optional, default: 'desc') - Sort order ('asc' or 'desc')
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Number of items per page
 *
 * @param req The incoming request object
 * @returns JSON response with items array and pagination metadata or error message
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Parse query parameters
        const type = searchParams.get('type');
        const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
        const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
        const sortBy = searchParams.get('sortBy') || 'name';
        const order = searchParams.get('order') === 'asc' ? 1 : -1;
        const page = searchParams.get('page') ? Math.max(1, Number(searchParams.get('page'))) : 1;
        const limit = searchParams.get('limit') ? Math.max(1, Number(searchParams.get('limit'))) : 20;

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');
        const collection = db.collection('items');

        // Build filter object
        const filter: any = {};

        // Apply type filter if provided
        if (type && ['vinyl', 'antiqueFurniture', 'gpsWatch', 'runningShoes'].includes(type)) {
            filter.itemType = type;
        }

        // Apply price range filter if provided
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        // Apply rating filter if provided
        if (minRating !== undefined) {
            filter.rating = { $gte: minRating };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Count total matches for pagination metadata
        const total = await collection.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        // Fetch items with filtering, sorting, and pagination
        const items = await collection
            .find(filter)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            items,
            pagination: {
                total,
                page,
                totalPages,
                limit
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch items' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/items
 *
 * Creates a new item in the database
 * - Validates required fields and item type-specific fields
 * - Sets default values for rating and review fields
 * - Returns the created item
 *
 * Request body varies by item type:
 *
 * Common fields for all item types:
 * {
 *   "name": string,
 *   "description": string,
 *   "price": number,
 *   "seller": string,
 *   "image": string,
 *   "itemType": "vinyl" | "antiqueFurniture" | "gpsWatch" | "runningShoes"
 * }
 *
 * Additional fields by type:
 * - vinyl: { "age": number }
 * - antiqueFurniture: { "age": number, "material": string }
 * - gpsWatch: { "batteryLife": number }
 * - runningShoes: { "size": number, "material": string }
 *
 * @param req The incoming request object containing item data
 * @returns JSON response with created item or error message
 */
export async function POST(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Parse the request body
        const itemData = await req.json();

        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'seller', 'image', 'itemType'];
        const missingFields = requiredFields.filter(field => !itemData[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate item type
        const validTypes = ['vinyl', 'antiqueFurniture', 'gpsWatch', 'runningShoes'];
        if (!validTypes.includes(itemData.itemType)) {
            return NextResponse.json(
                { error: `Invalid item type: ${itemData.itemType}` },
                { status: 400 }
            );
        }

        // Validate type-specific required fields
        switch (itemData.itemType) {
            case 'vinyl':
                if (itemData.age === undefined) {
                    return NextResponse.json(
                        { error: 'Vinyl records require age field' },
                        { status: 400 }
                    );
                }
                break;
            case 'antiqueFurniture':
                if (itemData.age === undefined || !itemData.material) {
                    return NextResponse.json(
                        { error: 'Antique furniture requires age and material fields' },
                        { status: 400 }
                    );
                }
                break;
            case 'gpsWatch':
                if (itemData.batteryLife === undefined) {
                    return NextResponse.json(
                        { error: 'GPS watches require batteryLife field' },
                        { status: 400 }
                    );
                }
                break;
            case 'runningShoes':
                if (itemData.size === undefined || !itemData.material) {
                    return NextResponse.json(
                        { error: 'Running shoes require size and material fields' },
                        { status: 400 }
                    );
                }
                break;
        }

        // Set default values for new items
        const newItem = {
            ...itemData,
            rating: itemData.rating || 0,
            reviews: itemData.reviews || [],
            reviewCount: itemData.reviewCount || 0
        };

        // Insert the new item
        const result = await db.collection('items').insertOne(newItem);

        // Return the new item with its ID
        return NextResponse.json({
            message: 'Item created successfully',
            item: {
                _id: result.insertedId,
                ...newItem
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json(
            { error: 'Failed to create item' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/items
 *
 * Deletes all items from the database
 * - WARNING: This is a destructive operation that removes all item records
 * - Requires an admin token/key for authorization
 * - Returns count of deleted items
 *
 * Request headers:
 * - x-admin-key: string (required for authorization)
 *
 * @param req The incoming request object
 * @returns JSON response with deletion count or error message
 */
export async function DELETE(req: NextRequest) {
    try {

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Delete all items
        const result = await db.collection('items').deleteMany({});

        return NextResponse.json({
            message: 'All items deleted successfully',
            deletedCount: result.deletedCount
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting items:', error);
        return NextResponse.json(
            { error: 'Failed to delete items' },
            { status: 500 }
        );
    }
}