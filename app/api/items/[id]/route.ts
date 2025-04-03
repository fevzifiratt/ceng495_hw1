// app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define a proper params interface
interface RouteParams {
    params: {
        id: string;
    }
}

/**
 * GET /api/items/[id]
 *
 * Retrieves a specific item by its ID
 * - Validates the item ID format
 * - Returns the item if found
 * - Returns 404 if item not found
 *
 * @param req The incoming request object
 * @param params Route parameters containing the item ID
 * @returns JSON response with the item or error message
 */
export async function GET(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        // const id = params.id;
         const resolvedParams = await params;
         const id = resolvedParams.id;

        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid item ID format' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Find the item by ID
        const item = await db.collection('items').findOne({ _id: new ObjectId(id) });

        if (!item) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ item }, { status: 200 });
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json(
            { error: 'Failed to fetch item' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/items/[id]
 *
 * Deletes a specific item by its ID
 * - Validates the item ID format
 * - Removes reviews of this item from users' itemReviews
 * - Deletes the item
 * - Returns success message
 *
 * @param req The incoming request object
 * @param params Route parameters containing the item ID
 * @returns JSON response with success message or error message
 */
export async function DELETE(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        //const id = params.id;
         const resolvedParams = await params;
         const id = resolvedParams.id;

        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid item ID format' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Check if the item exists and get its reviews
        const existingItem = await db.collection('items').findOne({ _id: new ObjectId(id) });

        if (!existingItem) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Track users who need their reviews updated
        const usersToUpdate = new Set<string>();

        // If the item has reviews, remove them from the corresponding users
        if (existingItem.reviews && existingItem.reviews.length > 0) {
            for (const review of existingItem.reviews) {
                if (review.username) {
                    // Add this user to our update list
                    usersToUpdate.add(review.username);

                    // Remove this item's review from the user
                    await db.collection('users').updateOne(
                        { username: review.username },
                        {
                            $pull: { itemReviews: { itemId: id } as any },
                            $inc: { reviewCount: -1 }
                        }
                    );
                }
            }
        }

        // Delete the item
        const result = await db.collection('items').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete the item' },
                { status: 400 }
            );
        }

        // Update ratings for all affected users
        for (const username of Array.from(usersToUpdate)) {
            await updateUserRating(db, username);
        }

        return NextResponse.json({
            message: 'Item deleted successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json(
            { error: 'Failed to delete item' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to update a user's average rating as a reviewer
 *
 * @param db MongoDB database instance
 * @param username Username of the user to update
 */
async function updateUserRating(db: any, username: string) {
    // Get the user with all their reviews
    const user = await db.collection('users').findOne({
        username: username
    });

    if (!user || !user.itemReviews) return;

    const reviews = user.itemReviews;

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
        let validRatingsSum = 0;
        let validRatingsCount = 0;

        // Process each review safely
        for (const review of reviews) {
            if (!review) continue;

            let rating;
            if (typeof review.rating === 'number') {
                rating = review.rating;
            } else if (typeof review.rating === 'string') {
                rating = parseFloat(review.rating);
            }

            if (typeof rating === 'number' && !isNaN(rating)) {
                validRatingsSum += rating;
                validRatingsCount++;
            }
        }

        if (validRatingsCount > 0) {
            averageRating = parseFloat((validRatingsSum / validRatingsCount).toFixed(1));
        }
    }

    // Update the user with the new average rating
    await db.collection('users').updateOne(
        { username: username },
        { $set: { averageRating: averageRating } }
    );
}
