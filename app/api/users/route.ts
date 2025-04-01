// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcrypt';

/**
 * GET /api/users
 *
 * Retrieves all users from the database
 * - Excludes password fields for security
 * - Returns a JSON array of all users
 * - Uses projection to filter out sensitive data
 *
 * @param req The incoming request object
 * @returns JSON response with users array or error message
 */
export async function GET(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // You might want to limit what fields are returned for security
        const users = await db.collection('users').find({}, {
            projection: { password: 0 } // exclude passwords from results
        }).toArray();

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/users
 *
 * Creates a new user in the database
 * - Validates required fields (username, password)
 * - Checks for duplicate usernames
 * - Hashes password for secure storage
 * - Sets default values for rating-related fields
 * - Returns the created user without password
 *
 * Request body format:
 * {
 *   "username": string,
 *   "password": string,
 *   "isAdmin": boolean (optional, defaults to false)
 * }
 *
 * @param req The incoming request object containing user data
 * @returns JSON response with created user or error message
 */
export async function POST(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Parse the request body
        const body = await req.json();
        const { username, password, isAdmin = false } = body;

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 409 }
            );
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user object with initial values
        const newUser = {
            username,
            password: hashedPassword,
            isAdmin,
            averageRating: 0,
            itemReviews: [],
            reviewCount: 0
        };

        // Insert the new user
        const result = await db.collection('users').insertOne(newUser);

        // Return the new user (without password)
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            message: 'User created successfully',
            user: userWithoutPassword
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users
 *
 * Deletes all users from the database
 * - WARNING: This is a destructive operation that removes all user records
 * - Requires an admin token/key for authorization (basic implementation)
 * - Returns count of deleted users
 *
 * Request headers:
 * - x-admin-key: string (required for authorization)
 *
 * @param req The incoming request object
 * @returns JSON response with deletion count or error message
 */
export async function DELETE(req: NextRequest) {
    try {
        // Basic security check - require an admin key
        // In production, use a proper authentication system
        const adminKey = req.headers.get('x-admin-key');
        const expectedKey = process.env.ADMIN_DELETE_KEY;

        // Validate admin key
        if (!adminKey || adminKey !== expectedKey) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin key required' },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db('CENG495-HW1');

        // Delete all users
        const result = await db.collection('users').deleteMany({});

        return NextResponse.json({
            message: 'All users deleted successfully',
            deletedCount: result.deletedCount
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting users:', error);
        return NextResponse.json(
            { error: 'Failed to delete users' },
            { status: 500 }
        );
    }
}