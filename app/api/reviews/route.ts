// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * POST /api/reviews
 *
 * Creates a new review that's connected to both an item and a user
 * - Adds the review to the item's reviews array
 * - Adds the review to the user's itemReviews array
 * - Updates ratings for both entities
 * - Returns the created review
 *
 * Request body format:
 * {
 *   "itemId": string,          // ObjectId of the item being reviewed
 *   "username": string,        // Username of the reviewer
 *   "rating": number (1-10),    // Rating value (1-10)
 *   "comment": string          // Review comment
 * }
 *
 * @param req The incoming request object containing review data
 * @returns JSON response with the created review or error message
 */
// Update to app/api/reviews/route.ts POST function
export async function POST(req: NextRequest) {
    try {
        // Check for authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse the request body
        const reviewData = await req.json();

        // Validate required fields (comment is no longer required)
        const requiredFields = ['itemId', 'username', 'rating'];
        const missingFields = requiredFields.filter(field => !reviewData[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Ensure the username in the request matches the authenticated user
        if (reviewData.username !== session.user.name) {
            return NextResponse.json(
                { error: 'Cannot create reviews for other users' },
                { status: 403 }
            );
        }

        // Validate rating range
        if (reviewData.rating < 1 || reviewData.rating > 10) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 10' },
                { status: 400 }
            );
        }

        // Validate item ID
        if (!ObjectId.isValid(reviewData.itemId)) {
            return NextResponse.json(
                { error: 'Invalid item ID format' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Check if the item exists
        const item = await db.collection('items').findOne({
            _id: new ObjectId(reviewData.itemId)
        });

        if (!item) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Check if the user exists
        const user = await db.collection('users').findOne({
            username: reviewData.username
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if the user has already reviewed this item
        const existingItemReview = await db.collection('items').findOne({
            _id: new ObjectId(reviewData.itemId),
            "reviews.username": reviewData.username
        });

        // Create a new review with ID
        const reviewId = new ObjectId().toString();

        const itemReview = {
            _id: reviewId,
            username: reviewData.username,
            rating: reviewData.rating,
            comment: reviewData.comment || "", // Default to empty string if comment is not provided
            createdAt: new Date()
        };

        const userItemReview = {
            _id: reviewId,
            itemId: reviewData.itemId,
            itemName: item.name,
            rating: reviewData.rating,
            comment: reviewData.comment || "", // Default to empty string if comment is not provided
            createdAt: new Date()
        };

        // If user has already reviewed this item, remove the old review
        if (existingItemReview) {
            // Find the existing review ID
            const existingReview = existingItemReview.reviews.find(
                (r: any) => r.username === reviewData.username
            );

            if (existingReview) {
                const existingReviewId = existingReview._id;

                // Remove the old review from the item
                await db.collection('items').updateOne(
                    { _id: new ObjectId(reviewData.itemId) },
                    { $pull: { reviews: { _id: existingReviewId } as any } }
                );

                // Remove the old review from the user
                await db.collection('users').updateOne(
                    { username: reviewData.username },
                    { $pull: { itemReviews: { _id: existingReviewId } as any } }
                );
            }
        } else {
            // If it's a new review, increment the review counts
            await db.collection('items').updateOne(
                { _id: new ObjectId(reviewData.itemId) },
                { $inc: { reviewCount: 1 } }
            );

            await db.collection('users').updateOne(
                { username: reviewData.username },
                { $inc: { reviewCount: 1 } }
            );
        }

        // Add the new review to the item
        await db.collection('items').updateOne(
            { _id: new ObjectId(reviewData.itemId) },
            { $push: { reviews: itemReview as any} }
        );

        // Add the new review to the user
        await db.collection('users').updateOne(
            { username: reviewData.username },
            { $push: { itemReviews: userItemReview as any } }
        );

        // Update item rating
        await updateItemRating(db, reviewData.itemId);

        // Update user rating
        await updateUserRating(db, reviewData.username);

        return NextResponse.json({
            message: existingItemReview
                ? 'Review updated successfully'
                : 'Review created successfully',
            review: {
                _id: reviewId,
                itemId: reviewData.itemId,
                itemName: item.name,
                username: reviewData.username,
                rating: reviewData.rating,
                comment: reviewData.comment || "", // Default to empty string if comment is not provided
                createdAt: new Date()
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating/updating review:', error);
        return NextResponse.json(
            { error: 'Failed to create/update review' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/reviews
 *
 * Retrieves reviews with optional filtering by item or user
 * - Supports filtering by itemId or username
 * - Supports pagination
 * - Returns a JSON array of reviews with pagination metadata
 *
 * Query parameters:
 * - itemId: string (optional) - Filter by item ID
 * - username: string (optional) - Filter by username
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Number of reviews per page
 *
 * @param req The incoming request object
 * @returns JSON response with reviews array and pagination metadata or error message
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Parse query parameters
        const itemId = searchParams.get('itemId');
        const username = searchParams.get('username');
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.max(1, Number(searchParams.get('limit')) || 20);
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        let reviews = [];
        let total = 0;

        // If filtering by item
        if (itemId && !username) {
            if (!ObjectId.isValid(itemId)) {
                return NextResponse.json(
                    { error: 'Invalid item ID format' },
                    { status: 400 }
                );
            }

            // Get the item with its reviews
            const item = await db.collection('items').findOne(
                { _id: new ObjectId(itemId) },
                { projection: { reviews: 1 } }
            );

            if (!item) {
                return NextResponse.json({ reviews: [], pagination: { total: 0, page, totalPages: 0, limit } });
            }

            reviews = item.reviews || [];
            total = reviews.length;

            // Apply pagination
            reviews = reviews.slice(skip, skip + limit);
        }
        // If filtering by username
        else if (username && !itemId) {
            // Get the user with their reviews
            const user = await db.collection('users').findOne(
                { username },
                { projection: { itemReviews: 1 } }
            );

            if (!user) {
                return NextResponse.json({ reviews: [], pagination: { total: 0, page, totalPages: 0, limit } });
            }

            reviews = user.itemReviews || [];
            total = reviews.length;

            // Apply pagination
            reviews = reviews.slice(skip, skip + limit);
        }
        // If filtering by both or none
        else {
            // This is more complex and would require aggregating from both collections
            // For simplicity, let's return an error suggesting to filter by one criteria
            return NextResponse.json(
                { error: 'Please filter by either itemId or username, not both' },
                { status: 400 }
            );
        }

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            reviews,
            pagination: {
                total,
                page,
                totalPages,
                limit
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
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

    // Update the item with the new average rating
    await db.collection('items').updateOne(
        { _id: new ObjectId(itemId) },
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