import { Actor } from 'apify';
import { createHash } from 'node:crypto';

export class SnapshotManager {
    private storeName: string;

    constructor(storeName = 'SWIM-SNAPSHOTS') {
        this.storeName = storeName;
    }

    async getPrevious(url: string): Promise<string | null> {
        const store = await Actor.openKeyValueStore(this.storeName);
        const key = this.urlToKey(url);
        return (await store.getValue(key)) as string | null;
    }

    async save(url: string, html: string): Promise<void> {
        const store = await Actor.openKeyValueStore(this.storeName);
        const key = this.urlToKey(url);
        await store.setValue(key, html);
    }

    private urlToKey(url: string): string {
        return createHash('md5').update(url).digest('hex');
    }
}
