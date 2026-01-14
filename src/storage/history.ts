import { Actor, log } from 'apify';
import { createHash } from 'node:crypto';

export interface HistoryItem {
    timestamp: string;
    hash: string;
    html: string;
}

export class HistoryStore {
    private async getStoreKey(url: string): Promise<string> {
        const hash = createHash('md5').update(url).digest('hex');
        return `history_${hash}`;
    }

    /**
     * Retrieves the full history for a URL.
     */
    async getHistory(url: string): Promise<HistoryItem[]> {
        const store = await Actor.openKeyValueStore();
        const key = await this.getStoreKey(url);
        const history = await store.getValue(key) as HistoryItem[];
        return history || [];
    }

    /**
     * Adds a new snapshot to the history and prunes old entries.
     */
    async push(url: string, html: string, maxDepth: number = 5): Promise<void> {
        const store = await Actor.openKeyValueStore();
        const key = await this.getStoreKey(url);

        const history = await this.getHistory(url);

        const newItem: HistoryItem = {
            timestamp: new Date().toISOString(),
            hash: createHash('md5').update(html).digest('hex'),
            html,
        };

        // Prepend new item (newest first)
        const updatedHistory = [newItem, ...history].slice(0, maxDepth);

        await store.setValue(key, updatedHistory);
        log.info(`📊 History updated for ${url} (Depth: ${updatedHistory.length}/${maxDepth})`);
    }

    /**
     * Checks if a specific HTML hash already exists in the history.
     */
    async hasSeenHash(url: string, htmlHash: string): Promise<boolean> {
        const history = await this.getHistory(url);
        return history.some(item => item.hash === htmlHash);
    }
}
