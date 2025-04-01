// app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define a proper params interface
interface UserParams {
    params: {
        username: string;
    }
}

// Helper function to update an item's rating
async function updateItemRating(db: any, itemId: string) {
    // Get the item with all its reviews
    const item = await db.collection('items').findOne({
        _id: new ObjectId(itemId)
    });

    if (!item || !item.reviews) return;

    const reviews = item.reviews;

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
        const sum = reviews.reduce((total: number, review: any) => total + review.rating, 0);
        averageRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    // Update the item with the new average rating
    await db.collection('items').updateOne(
        { _id: new ObjectId(itemId) },
        { $set: { rating: averageRating } }
    );
}

/**
 * GET /api/users/[username]
 * Retrieve a specific user by username
 *
 * No request body required
 *
 * Returns the user object (without password)
 */
export async function GET(
    request: NextRequest,
    { params }: UserParams
) {
    try {
        // Need to wait for params to be fully resolved
        const resolvedParams = await params;
        const username = resolvedParams.username;

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Don't return the password
        delete user.password;

        return NextResponse.json(user);
    } catch (error) {
        console.error(`Failed to fetch user:`, error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/users/[username]
 * Update a specific user
 *
 * Request body format:
 * {
 *   "email": string (optional),
 *   "name": string (optional),
 *   "role": string (optional),
 *   "isAdmin": boolean (optional),
 *   ... any other user fields to update
 * }
 *
 * Cannot update username
 * Returns the updated user object (without password)
 */
export async function PUT(
    request: NextRequest,
    { params }: UserParams
) {
    try {
        // Need to wait for params to be fully resolved
        const resolvedParams = await params;
        const username = resolvedParams.username;
        const updateData = await request.json();

        // Don't allow updating the username
        if (updateData.username && updateData.username !== username) {
            return NextResponse.json(
                { error: 'Cannot change username' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');
        const usersCollection = db.collection('users');

        // Find the user first to check if it exists
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Delete username from update data if present
        delete updateData.username;

        // Update user fields
        const result = await usersCollection.updateOne(
            { username },
            { $set: updateData }
        );

        // Get the updated user
        const updatedUser = await usersCollection.findOne({ username });

        // Check if the user exists after update
        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found after update' },
                { status: 404 }
            );
        }

        // Don't return the password
        delete updatedUser.password;

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(`Failed to update user:`, error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[username]
 * Remove a specific user from the database
 * Also removes all reviews by this user from the items collection
 *
 * No request body required
 *
 * Returns a success message if deletion is successful
 */
export async function DELETE(
    request: NextRequest,
    { params }: UserParams
) {
    try {
        // Need to wait for params to be fully resolved
        const resolvedParams = await params;
        const username = resolvedParams.username;

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');
        const usersCollection = db.collection('users');

        // First, find the user to get their reviews
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Track which items need rating recalculation
        const itemsToUpdate = new Set<string>();

        // If the user has reviews, remove them from the corresponding items
        if (user.itemReviews && user.itemReviews.length > 0) {
            for (const review of user.itemReviews) {
                // Add this item to our update list - ensure it's a string
                if (review.itemId) {
                    itemsToUpdate.add(String(review.itemId));
                }

                // Remove this user's review from the item
                await db.collection('items').updateOne(
                    { _id: new ObjectId(review.itemId) },
                    {
                        $pull: { reviews: { username: username } as any },
                        $inc: { reviewCount: -1 }
                    }
                );
            }
        }

        // Delete the user
        const result = await usersCollection.deleteOne({ username });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete user' },
                { status: 500 }
            );
        }

        // Update ratings for all affected items
        for (const itemId of Array.from(itemsToUpdate)) {
            await updateItemRating(db, itemId);
        }

        return NextResponse.json(
            { message: 'User deleted successfully' }
        );
    } catch (error) {
        console.error(`Failed to delete user:`, error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}