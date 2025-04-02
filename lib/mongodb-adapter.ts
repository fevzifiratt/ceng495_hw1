// lib/mongodb-adapter.ts
import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

export const getMongoDBAdapter = () => {
    return MongoDBAdapter(clientPromise, {
        databaseName: "CENG495-HW1",
        collections: {
            Users: "users",
            Sessions: "sessions",
            VerificationTokens: "verification_tokens",
        }
    });
};