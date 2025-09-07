"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { getMongoConnection, closeMongoConnection, COLLECTIONS, type Patient, type Doctor, type Appointment, type Prescription, type Billing } from "../lib/mongodb";
import rag from "../system/ai/rag";

// Helper function to format data for RAG ingestion
function formatDataForRAG(data: any[], collectionName: string): string {
    return data.map((item, index) => {
        const formattedItem = {
            id: item._id?.toString() || `item_${index}`,
            collection: collectionName,
            data: item
        };
        return `Collection: ${collectionName}\nDocument ID: ${formattedItem.id}\nData: ${JSON.stringify(item, null, 2)}\n---\n`;
    }).join('\n');
}

// Helper function to create searchable text from medical data
function createSearchableText(data: any[], collectionName: string): string {
    return data.map((item, index) => {
        let searchableText = `Medical ${collectionName.slice(0, -1)} Information:\n`;

        // Add relevant fields based on collection type
        switch (collectionName) {
            case COLLECTIONS.PATIENTS:
                searchableText += `Patient: ${item.name || 'Unknown'}\n`;
                searchableText += `Age: ${item.age || 'Not specified'}\n`;
                searchableText += `Gender: ${item.gender || 'Not specified'}\n`;
                if (item.medicalHistory) {
                    searchableText += `Medical History: ${Array.isArray(item.medicalHistory) ? item.medicalHistory.join(', ') : item.medicalHistory}\n`;
                }
                if (item.allergies) {
                    searchableText += `Allergies: ${Array.isArray(item.allergies) ? item.allergies.join(', ') : item.allergies}\n`;
                }
                break;

            case COLLECTIONS.DOCTORS:
                searchableText += `Doctor: ${item.name || 'Unknown'}\n`;
                searchableText += `Specialization: ${item.specialization || 'Not specified'}\n`;
                searchableText += `Experience: ${item.experience || 'Not specified'} years\n`;
                break;

            case COLLECTIONS.APPOINTMENTS:
                searchableText += `Appointment Date: ${item.date || 'Not specified'}\n`;
                searchableText += `Time: ${item.time || 'Not specified'}\n`;
                searchableText += `Status: ${item.status || 'Not specified'}\n`;
                searchableText += `Reason: ${item.reason || 'Not specified'}\n`;
                if (item.notes) {
                    searchableText += `Notes: ${item.notes}\n`;
                }
                break;

            case COLLECTIONS.PRESCRIPTIONS:
                searchableText += `Prescription Date: ${item.date || 'Not specified'}\n`;
                if (item.medications && Array.isArray(item.medications)) {
                    searchableText += `Medications:\n`;
                    item.medications.forEach((med: any, medIndex: number) => {
                        searchableText += `  ${medIndex + 1}. ${med.name || 'Unknown medication'}`;
                        if (med.dosage) searchableText += ` - Dosage: ${med.dosage}`;
                        if (med.frequency) searchableText += ` - Frequency: ${med.frequency}`;
                        if (med.duration) searchableText += ` - Duration: ${med.duration}`;
                        searchableText += '\n';
                    });
                }
                if (item.notes) {
                    searchableText += `Notes: ${item.notes}\n`;
                }
                break;

            case COLLECTIONS.BILLINGS:
                searchableText += `Billing Date: ${item.date || 'Not specified'}\n`;
                searchableText += `Amount: $${item.amount || '0'}\n`;
                searchableText += `Status: ${item.status || 'Not specified'}\n`;
                if (item.services && Array.isArray(item.services)) {
                    searchableText += `Services: ${item.services.join(', ')}\n`;
                }
                break;
        }

        // Add all other fields as additional context
        const otherFields = Object.keys(item).filter(key =>
            key !== '_id' &&
            !['name', 'age', 'gender', 'medicalHistory', 'allergies', 'specialization', 'experience',
                'date', 'time', 'status', 'reason', 'notes', 'medications', 'amount', 'services'].includes(key)
        );

        if (otherFields.length > 0) {
            searchableText += `Additional Information:\n`;
            otherFields.forEach(field => {
                searchableText += `${field}: ${JSON.stringify(item[field])}\n`;
            });
        }

        return searchableText;
    }).join('\n\n');
}

export const syncMongoDataToRAG = action({
    args: {
        organizationId: v.string(),
        collections: v.optional(v.array(v.string())), // Optional: specify which collections to sync
    },
    handler: async (ctx, args) => {
        try {
            const db = await getMongoConnection();
            const collectionsToSync = args.collections || Object.values(COLLECTIONS);

            console.log(`Starting MongoDB sync for organization: ${args.organizationId}`);
            console.log(`Collections to sync: ${collectionsToSync.join(', ')}`);

            let totalDocuments = 0;
            const syncResults: { collection: string; count: number; success: boolean; error?: string }[] = [];

            for (const collectionName of collectionsToSync) {
                try {
                    console.log(`Syncing collection: ${collectionName}`);

                    // Get all documents from the collection
                    const collection = db.collection(collectionName);
                    const documents = await collection.find({}).toArray();

                    if (documents.length === 0) {
                        console.log(`No documents found in ${collectionName}`);
                        syncResults.push({ collection: collectionName, count: 0, success: true });
                        continue;
                    }

                    // Create searchable text for RAG
                    const searchableText = createSearchableText(documents, collectionName);

                    // Add to RAG system
                    const { entryId, created } = await rag.add(ctx, {
                        namespace: args.organizationId,
                        text: searchableText,
                        key: `mongo_${collectionName}_${Date.now()}`,
                        title: `Medical ${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)} Data`,
                        metadata: {
                            source: 'mongodb',
                            collection: collectionName,
                            documentCount: documents.length,
                            syncedAt: new Date().toISOString(),
                            organizationId: args.organizationId,
                        },
                    });

                    totalDocuments += documents.length;
                    syncResults.push({
                        collection: collectionName,
                        count: documents.length,
                        success: true
                    });

                    console.log(`Successfully synced ${documents.length} documents from ${collectionName} to RAG`);

                } catch (error) {
                    console.error(`Error syncing collection ${collectionName}:`, error);
                    syncResults.push({
                        collection: collectionName,
                        count: 0,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            await closeMongoConnection();

            return {
                success: true,
                totalDocuments,
                organizationId: args.organizationId,
                syncResults,
                message: `Successfully synced ${totalDocuments} documents from MongoDB to RAG system`
            };

        } catch (error) {
            console.error('MongoDB sync error:', error);
            await closeMongoConnection();

            return {
                success: false,
                totalDocuments: 0,
                organizationId: args.organizationId,
                syncResults: [],
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to sync MongoDB data to RAG system'
            };
        }
    }
});

export const getMongoCollectionStats = action({
    args: {},
    handler: async () => {
        try {
            const db = await getMongoConnection();
            const stats: { [key: string]: { count: number; sample?: any } } = {};

            for (const collectionName of Object.values(COLLECTIONS)) {
                try {
                    const collection = db.collection(collectionName);
                    const count = await collection.countDocuments();
                    const sample = count > 0 ? await collection.findOne({}) : null;

                    stats[collectionName] = {
                        count,
                        sample: sample ? {
                            _id: sample._id,
                            // Include a few key fields for preview
                            ...Object.fromEntries(
                                Object.entries(sample).slice(0, 5).filter(([key]) => key !== '_id')
                            )
                        } : null
                    };
                } catch (error) {
                    console.error(`Error getting stats for ${collectionName}:`, error);
                    stats[collectionName] = { count: 0 };
                }
            }

            await closeMongoConnection();
            return { success: true, stats };

        } catch (error) {
            console.error('Error getting MongoDB stats:', error);
            await closeMongoConnection();
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stats: {}
            };
        }
    }
});
