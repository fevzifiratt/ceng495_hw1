// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the built-in User type from next-auth
declare module "next-auth" {
    interface User extends DefaultUser {
        isAdmin: boolean;
        name: string | null;
        averageRating?: number;
        reviewCount?: number;
    }

    interface Session {
        user: {
            id?: string;
            name?: string | null;
            isAdmin: boolean;
            averageRating?: number;
            reviewCount?: number;
        } & Omit<DefaultSession["user"], "email" | "image">;
    }
}

// Extend the JWT type
declare module "next-auth/jwt" {
    interface JWT {
        isAdmin: boolean;
        username?: string;
        averageRating?: number;
        reviewCount?: number;
        userId?: string;
    }
}