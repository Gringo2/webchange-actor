import { Actor } from 'apify';
import { createHash } from 'node:crypto';

interface SnapshotRecord {
    html: string;
    timestamp: string;
}

export class SnapshotManager {
    private storeName: string;

    constructor(storeName = 'SWIM-SNAPSHOTS') {
        this.storeName = storeName;
    }

    async getPrevious(url: string): Promise<string | null> {
        const store = await Actor.openKeyValueStore(this.storeName);
        const key = this.urlToKey(url);
        const record = (await store.getValue(key)) as SnapshotRecord | string | null;

        if (!record) return null;
        // Handle migration from raw string to object
        if (typeof record === 'string') return record;
        return record.html;
    }

    async save(url: string, html: string): Promise<void> {
        const store = await Actor.openKeyValueStore(this.storeName);
        const key = this.urlToKey(url);
        const record: SnapshotRecord = {
            html,
            timestamp: new Date().toISOString(),
        };
        await store.setValue(key, record);
    }

    /**
     * God-Mode: Prune records older than X days to save storage costs.
     */
    async prune(days: number): Promise<number> {
        const store = await Actor.openKeyValueStore(this.storeName);
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let prunedCount = 0;

        await store.forEachKey(async (key) => {
            const record = (await store.getValue(key)) as SnapshotRecord | string | null;
            if (record && typeof record !== 'string') {
                const ts = new Date(record.timestamp).getTime();
                if (ts < cutoff) {
                    await store.setValue(key, null);
                    prunedCount++;
                }
            }
        });

        return prunedCount;
    }

    private urlToKey(url: string): string {
        return createHash('md5').update(url).digest('hex');
    }
}
