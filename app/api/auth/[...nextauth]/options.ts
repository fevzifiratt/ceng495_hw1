// 1. Create a separate config file (e.g., app/api/auth/[...nextauth]/options.ts)
// app/api/auth/[...nextauth]/options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "username" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                try {
                    const client = await clientPromise;
                    const db = client.db("CENG495-HW1");

                    const user = await db.collection("users").findOne({
                        username: credentials.username
                    });

                    if (!user) {
                        console.log("User not found");
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!passwordMatch) {
                        console.log("Password doesn't match");
                        return null;
                    }

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
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    pages: {
        signIn: '/login',
        error: '/login',
        signOut: '/'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.isAdmin = !!user.isAdmin;
                token.username = user.name || undefined;
                token.averageRating = user.averageRating;
                token.reviewCount = user.reviewCount;
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.isAdmin = !!token.isAdmin;
                session.user.name = token.username || null;
                session.user.averageRating = token.averageRating;
                session.user.reviewCount = token.reviewCount;
                session.user.id = token.userId;
            }
            return session;
        }
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET
};