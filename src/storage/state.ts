import { KeyValueStore } from 'apify';

export class SnapshotManager {
    private storeName: string;

    constructor(storeName = 'SWIM-SNAPSHOTS') {
        this.storeName = storeName;
    }

    async getPrevious(url: string): Promise<string | null> {
        const store = await KeyValueStore.open(this.storeName);
        const key = this.urlToKey(url);
        return (await store.getValue(key)) as string | null;
    }

    async save(url: string, html: string): Promise<void> {
        const store = await KeyValueStore.open(this.storeName);
        const key = this.urlToKey(url);
        await store.setValue(key, html);
    }

    private urlToKey(url: string): string {
        return url.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 250);
    }
}
