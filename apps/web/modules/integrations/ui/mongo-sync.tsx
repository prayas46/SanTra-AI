"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@workspace/ui/src/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/src/components/card";
import { Badge } from "@workspace/ui/src/components/badge";
import { Alert, AlertDescription } from "@workspace/ui/src/components/alert";
import { Loader2, Database, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface SyncResult {
    collection: string;
    count: number;
    success: boolean;
    error?: string;
}

interface SyncResponse {
    success: boolean;
    totalDocuments: number;
    organizationId: string;
    syncResults: SyncResult[];
    message: string;
    error?: string;
}

interface MongoStats {
    success: boolean;
    stats: {
        [key: string]: {
            count: number;
            sample?: any;
        };
    };
    error?: string;
}

export function MongoSyncCard() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
    const [mongoStats, setMongoStats] = useState<MongoStats | null>(null);

    const syncMongoData = useAction(api.public.mongoSync.syncMongoData);
    const getMongoStats = useAction(api.public.mongoSync.getMongoStats);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);

        try {
            const result = await syncMongoData({});
            setSyncResult(result);
        } catch (error) {
            console.error("Sync error:", error);
            setSyncResult({
                success: false,
                totalDocuments: 0,
                organizationId: "",
                syncResults: [],
                message: "Failed to sync MongoDB data",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGetStats = async () => {
        setIsLoadingStats(true);

        try {
            const stats = await getMongoStats({});
            setMongoStats(stats);
        } catch (error) {
            console.error("Stats error:", error);
            setMongoStats({
                success: false,
                stats: {},
                error: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsLoadingStats(false);
        }
    };

    const collections = [
        { name: "patients", label: "Patients", description: "Patient records and medical history" },
        { name: "doctors", label: "Doctors", description: "Doctor profiles and specializations" },
        { name: "appointments", label: "Appointments", description: "Scheduled appointments and visits" },
        { name: "prescriptions", label: "Prescriptions", description: "Medication prescriptions" },
        { name: "bilings", label: "Billing", description: "Billing and payment records" },
    ];

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    MongoDB Medical Database Sync
                </CardTitle>
                <CardDescription>
                    Sync your local MongoDB medical database with the RAG system for AI-powered search and assistance.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Connection Info */}
                <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Database Connection</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Host:</strong> localhost:27017</p>
                        <p><strong>Database:</strong> medicalDB</p>
                        <p><strong>Collections:</strong> {collections.length} collections available</p>
                    </div>
                </div>

                {/* Collection Overview */}
                <div>
                    <h4 className="font-medium mb-3">Available Collections</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {collections.map((collection) => (
                            <div key={collection.name} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{collection.label}</p>
                                    <p className="text-sm text-muted-foreground">{collection.description}</p>
                                </div>
                                {mongoStats?.stats[collection.name] && (
                                    <Badge variant="secondary">
                                        {mongoStats.stats[collection.name].count} docs
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleGetStats}
                        disabled={isLoadingStats}
                        variant="outline"
                    >
                        {isLoadingStats ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Stats
                    </Button>

                    <Button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex-1"
                    >
                        {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Database className="h-4 w-4 mr-2" />
                        )}
                        Sync to RAG System
                    </Button>
                </div>

                {/* Sync Results */}
                {syncResult && (
                    <div className="space-y-4">
                        <Alert className={syncResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                            <div className="flex items-center gap-2">
                                {syncResult.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <AlertDescription className={syncResult.success ? "text-green-800" : "text-red-800"}>
                                    {syncResult.message}
                                </AlertDescription>
                            </div>
                        </Alert>

                        {syncResult.syncResults.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">Sync Results by Collection</h4>
                                <div className="space-y-2">
                                    {syncResult.syncResults.map((result) => (
                                        <div key={result.collection} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {result.success ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                )}
                                                <span className="font-medium capitalize">
                                                    {result.collection}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={result.success ? "default" : "destructive"}>
                                                    {result.count} documents
                                                </Badge>
                                                {result.error && (
                                                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MongoDB Stats */}
                {mongoStats && (
                    <div>
                        <h4 className="font-medium mb-3">Database Statistics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(mongoStats.stats).map(([collection, stats]) => (
                                <div key={collection} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium capitalize">{collection}</span>
                                        <Badge variant="outline">{stats.count} docs</Badge>
                                    </div>
                                    {stats.sample && (
                                        <div className="text-xs text-muted-foreground">
                                            <p>Sample fields: {Object.keys(stats.sample).slice(0, 3).join(", ")}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
