import { Actor, log } from 'apify';
import { createHash } from 'node:crypto';

export interface HistoryItem {
    timestamp: string;
    hash: string;
    html: string;
}

export class HistoryStore {
    private async getStoreKey(url: string, prefix = 'history'): Promise<string> {
        const hash = createHash('md5').update(url).digest('hex');
        return `${prefix}_${hash}`;
    }

    /**
     * Retrieves the full history for a URL.
     */
    async getHistory(url: string): Promise<HistoryItem[]> {
        const store = await Actor.openKeyValueStore('SWIM-HISTORY');
        const key = await this.getStoreKey(url);
        const history = await store.getValue(key) as HistoryItem[];
        return history || [];
    }

    /**
     * Adds a new snapshot to the history and prunes old entries.
     */
    async push(url: string, html: string, maxDepth: number = 5): Promise<void> {
        const store = await Actor.openKeyValueStore('SWIM-HISTORY');
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
     * God-Mode: Pattern Recognition Support
     * Stores the last AI summaries to help spot recurring trends.
     */
    async pushSummary(url: string, summary: string, maxDepth: number = 5): Promise<void> {
        const store = await Actor.openKeyValueStore('SWIM-SUMMARIES');
        const key = await this.getStoreKey(url, 'sum');
        const history = await this.getSummaries(url);
        const updated = [summary, ...history].slice(0, maxDepth);
        await store.setValue(key, updated);
    }

    async getSummaries(url: string): Promise<string[]> {
        const store = await Actor.openKeyValueStore('SWIM-SUMMARIES');
        const key = await this.getStoreKey(url, 'sum');
        return (await store.getValue(key) as string[]) || [];
    }

    /**
     * Checks if a specific HTML hash already exists in the history.
     */
    async hasSeenHash(url: string, htmlHash: string): Promise<boolean> {
        const history = await this.getHistory(url);
        return history.some(item => item.hash === htmlHash);
    }
}
