import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";

/**
 * NextAuth.js configuration options
 * This defines how authentication works in your application
 */
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            // Name displayed on the sign-in form
            name: "Credentials",

            // Define the form fields that will appear on the sign-in page
            credentials: {
                username: { label: "Username", type: "text", placeholder: "username" },
                password: { label: "Password", type: "password" }
            },

            // The function that verifies credentials and returns a user
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                try {
                    // Connect to MongoDB
                    const client = await clientPromise;
                    const db = client.db("CENG495-HW1");

                    // Find the user by username
                    const user = await db.collection("users").findOne({
                        username: credentials.username
                    });

                    // If user not found, return null
                    if (!user) {
                        console.log("User not found");
                        return null;
                    }

                    // Compare the password with hashed password in database
                    const passwordMatch = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    // If password doesn't match, return null
                    if (!passwordMatch) {
                        console.log("Password doesn't match");
                        return null;
                    }

                    // Return user data (without password) to be encoded in the JWT
                    return {
                        id: user._id.toString(),
                        name: user.username,
                        email: user.email || undefined,
                        isAdmin: !!user.isAdmin,
                        averageRating: user.averageRating,
                        reviewCount: user.reviewCount
                    };
                } catch (error) {
                    console.error("Authentication error:", error);
                    return null;
                }
            }
        })
    ],

    // Use JWT strategy for session management
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },

    // Custom pages for authentication
    pages: {
        signIn: '/login',
        error: '/login',
        signOut: '/'
    },

    // Callbacks to customize token and session data
    callbacks: {
        // Modify the JWT token contents
        async jwt({ token, user, account }) {
            if (user) {
                // Add custom user data to the token
                token.isAdmin = !!user.isAdmin;
                token.username = user.name || undefined;
                token.averageRating = user.averageRating;
                token.reviewCount = user.reviewCount;
                token.userId = user.id;
            }
            return token;
        },

        // Modify the session object that's available on the client
        async session({ session, token }) {
            if (session.user) {
                // Add custom user data to the session
                session.user.isAdmin = !!token.isAdmin;
                session.user.name = token.username || null;
                session.user.averageRating = token.averageRating;
                session.user.reviewCount = token.reviewCount;
                session.user.id = token.userId;
            }
            return session;
        }
    },

    // Enable debug messages in development
    debug: process.env.NODE_ENV === 'development',

    // Secret for encryption (should match NEXTAUTH_SECRET in .env)
    secret: process.env.NEXTAUTH_SECRET
};

// Create the handler using NextAuth and export it
const handler = NextAuth(authOptions);

// Export the GET and POST handlers for the API route
export { handler as GET, handler as POST };