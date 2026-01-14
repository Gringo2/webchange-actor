import { Actor } from 'apify';
import { createHash } from 'node:crypto';
import { DiffItem } from '../types.js';

export interface DeduplicationOptions {
    cooldownHours?: number;
}

export class Deduplicator {
    /**
     * Generates a unique hash for a change event.
     * Combines URL + Structural Diff + Severity to catch 'similar' changes.
     */
    static generateEventHash(url: string, diffs: DiffItem[], severity: number): string {
        const diffSignature = diffs.map(d => `${d.path}:${d.type}:${d.new?.substring(0, 20)}`).join('|');
        const data = `${url}|${diffSignature}|${severity}`;
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Checks if an event is a duplicate within the cooldown window.
     */
    async isDuplicate(eventHash: string, cooldownHours: number = 24): Promise<boolean> {
        const store = await Actor.openKeyValueStore();
        const key = `dedupe_${eventHash}`;

        const lastSeen = await store.getValue(key) as string;

        if (lastSeen) {
            const lastSeenDate = new Date(lastSeen);
            const hoursSince = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60);

            if (hoursSince < cooldownHours) {
                return true;
            }
        }

        return false;
    }

    /**
     * Records an event to the deduplication store.
     */
    async recordEvent(eventHash: string): Promise<void> {
        const store = await Actor.openKeyValueStore();
        const key = `dedupe_${eventHash}`;
        await store.setValue(key, new Date().toISOString());
    }
}
