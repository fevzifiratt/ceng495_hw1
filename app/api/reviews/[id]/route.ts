// app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/reviews/[id]
 *
 * Retrieves a specific review by its ID (from either item or user collection)
 * - Validates the review ID format
 * - Searches for the review in items and users collections
 * - Returns the review if found
 * - Returns 404 if review not found
 *
 * @param req The incoming request object
 * @param params Route parameters containing the review ID
 * @returns JSON response with the review or error message
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // First try to find the review in an item's reviews array
        const itemWithReview = await db.collection('items').findOne({
            "reviews._id": id
        });

        if (itemWithReview) {
            const review = itemWithReview.reviews.find((r: any) => r._id === id);
            if (review) {
                return NextResponse.json({
                    review: {
                        ...review,
                        itemId: itemWithReview._id.toString(),
                        itemName: itemWithReview.name
                    }
                }, { status: 200 });
            }
        }

        // If not found in items, try to find in users' itemReviews array
        const userWithReview = await db.collection('users').findOne({
            "itemReviews._id": id
        });

        if (userWithReview) {
            const review = userWithReview.itemReviews.find((r: any) => r._id === id);
            if (review) {
                return NextResponse.json({
                    review: {
                        ...review,
                        username: userWithReview.username
                    }
                }, { status: 200 });
            }
        }

        // If we get here, the review was not found in either collection
        return NextResponse.json(
            { error: 'Review not found' },
            { status: 404 }
        );
    } catch (error) {
        console.error('Error fetching review:', error);
        return NextResponse.json(
            { error: 'Failed to fetch review' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/reviews/[id]
 *
 * Deletes a specific review from both item and user collections
 * - Finds the review in items and users collections
 * - Removes it from both places
 * - Recalculates ratings for both entities
 * - Returns success message
 *
 * @param req The incoming request object
 * @param params Route parameters containing the review ID
 * @returns JSON response with success message or error message
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // First find the item containing this review
        const itemWithReview = await db.collection('items').findOne({
            "reviews._id": id
        });

        if (!itemWithReview) {
            return NextResponse.json(
                { error: 'Review not found in any item' },
                { status: 404 }
            );
        }

        // Find the review to get the username
        const review = itemWithReview.reviews.find((r: any) => r._id === id);
        if (!review) {
            return NextResponse.json(
                { error: 'Review not found in the item' },
                { status: 404 }
            );
        }

        const username = review.username;
        const itemId = itemWithReview._id;

        // Now remove the review from the item
        const itemUpdateResult = await db.collection('items').updateOne(
            { _id: itemId },
            {
                $pull: { reviews: { _id: id } as any},
                $inc: { reviewCount: -1 }
            }
        );

        // Also remove the review from the user's itemReviews
        const userUpdateResult = await db.collection('users').updateOne(
            { username: username },
            {
                $pull: { itemReviews: { _id: id } as any},
                $inc: { reviewCount: -1 }
            }
        );

        // If neither update modified anything, something went wrong
        if (itemUpdateResult.modifiedCount === 0 && userUpdateResult.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete review from either collection' },
                { status: 400 }
            );
        }

        // Update item rating
        await updateItemRating(db, itemId);

        // Update user rating
        await updateUserRating(db, username);

        return NextResponse.json({
            message: 'Review deleted successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json(
            { error: 'Failed to delete review' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/reviews/[id]
 *
 * Updates a specific review in both item and user collections
 * - Finds the review in items and users collections
 * - Updates it in both places
 * - Recalculates ratings if necessary
 * - Returns the updated review
 *
 * Request body format:
 * {
 *   "rating": number (1-10) (optional),
 *   "comment": string (optional)
 * }
 *
 * @param req The incoming request object containing update data
 * @param params Route parameters containing the review ID
 * @returns JSON response with the updated review or error message
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const updateData = await req.json();
        const updateFields: any = {};

        // Validate and prepare update fields
        if (updateData.rating !== undefined) {
            if (updateData.rating < 1 || updateData.rating > 10) {
                return NextResponse.json(
                    { error: 'Rating must be between 1 and 10' },
                    { status: 400 }
                );
            }
            updateFields.rating = updateData.rating;
        }

        if (updateData.comment !== undefined) {
            updateFields.comment = updateData.comment;
        }

        // Ensure there are fields to update
        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // First find the item containing this review
        const itemWithReview = await db.collection('items').findOne({
            "reviews._id": id
        });

        if (!itemWithReview) {
            return NextResponse.json(
                { error: 'Review not found in any item' },
                { status: 404 }
            );
        }

        // Find the review to get the username
        const review = itemWithReview.reviews.find((r: any) => r._id === id);
        if (!review) {
            return NextResponse.json(
                { error: 'Review not found in the item' },
                { status: 404 }
            );
        }

        const username = review.username;
        const itemId = itemWithReview._id;

        // Update the review in the item's reviews array
        const itemUpdateResult = await db.collection('items').updateOne(
            {
                _id: itemId,
                "reviews._id": id
            },
            {
                $set: Object.entries(updateFields).reduce((obj, [key, value]) => {
                    obj[`reviews.$.${key}`] = value;
                    return obj;
                }, {} as any)
            }
        );

        // Update the review in the user's itemReviews array
        const userUpdateResult = await db.collection('users').updateOne(
            {
                username: username,
                "itemReviews._id": id
            },
            {
                $set: Object.entries(updateFields).reduce((obj, [key, value]) => {
                    obj[`itemReviews.$.${key}`] = value;
                    return obj;
                }, {} as any)
            }
        );

        // If neither update modified anything, something went wrong
        if (itemUpdateResult.modifiedCount === 0 && userUpdateResult.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to update review in either collection' },
                { status: 400 }
            );
        }

        // If rating was updated, recalculate averages
        if (updateData.rating !== undefined) {
            // Update item rating
            await updateItemRating(db, itemId);

            // Update user rating
            await updateUserRating(db, username);
        }

        // Get the updated item to extract the updated review
        const updatedItem = await db.collection('items').findOne({ _id: itemId });
        const updatedReview = updatedItem?.reviews.find((r: any) => r._id === id);

        return NextResponse.json({
            message: 'Review updated successfully',
            review: {
                ...updatedReview,
                itemId: itemId.toString(),
                itemName: updatedItem?.name
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { error: 'Failed to update review' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to update an item's average rating
 *
 * @param db MongoDB database instance
 * @param itemId ID of the item to update
 */
async function updateItemRating(db: any, itemId: any) {
    // Get the item with all its reviews
    const item = await db.collection('items').findOne({
        _id: itemId
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
        { _id: itemId },
        { $set: { rating: averageRating } }
    );
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
        const sum = reviews.reduce((total: number, review: any) => total + review.rating, 0);
        averageRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    // Update the user with the new average rating
    await db.collection('users').updateOne(
        { username: username },
        { $set: { averageRating: averageRating } }
    );
}