"use node";

import { action } from "../_generated/server";
import { getMongoConnection, closeMongoConnection, COLLECTIONS } from "../lib/mongodb";

export const testMongoConnection = action({
    args: {},
    handler: async () => {
        try {
            console.log("Testing MongoDB connection...");
            const db = await getMongoConnection();

            // Test connection by listing collections
            const collections = await db.listCollections().toArray();
            console.log("Available collections:", collections.map(c => c.name));

            // Test each collection
            const results: { [key: string]: { count: number; sample?: any } } = {};

            for (const collectionName of Object.values(COLLECTIONS)) {
                try {
                    const collection = db.collection(collectionName);
                    const count = await collection.countDocuments();
                    const sample = count > 0 ? await collection.findOne({}) : null;

                    results[collectionName] = {
                        count,
                        sample: sample ? {
                            _id: sample._id,
                            // Include first few fields for preview
                            ...Object.fromEntries(
                                Object.entries(sample).slice(0, 3).filter(([key]) => key !== '_id')
                            )
                        } : null
                    };

                    console.log(`${collectionName}: ${count} documents`);
                } catch (error) {
                    console.error(`Error accessing ${collectionName}:`, error);
                    results[collectionName] = { count: 0 };
                }
            }

            await closeMongoConnection();

            return {
                success: true,
                message: "MongoDB connection successful",
                collections: collections.map(c => c.name),
                results
            };

        } catch (error) {
            console.error("MongoDB connection test failed:", error);
            await closeMongoConnection();

            return {
                success: false,
                message: "MongoDB connection failed",
                error: error instanceof Error ? error.message : "Unknown error",
                collections: [],
                results: {}
            };
        }
    }
});
