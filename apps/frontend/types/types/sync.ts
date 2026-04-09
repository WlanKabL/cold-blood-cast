export interface SyncAllResult {
    total: number;
    triggered: number;
    rateLimited: number;
    alreadyRunning: number;
    connections?: Array<{
        connectionId: string;
        accountId: string | null;
        accountName?: string;
        status: string;
        jobId?: string;
        nextSyncAt?: string;
    }>;
}
