import { HistoryStore } from './storage/history.js';
import { SnapshotManager } from './storage/state.js';
import { Actor } from 'apify';

console.log('🧪 Starting God-Mode Verification...');

async function testHistory() {
    console.log('1. Verifying Summary History...');
    const history = new HistoryStore();
    const url = 'https://pattern-test.com';

    await history.pushSummary(url, 'Price dropped to $99', 5);
    await history.pushSummary(url, 'Price returned to $120', 5);

    const summaries = await history.getSummaries(url);
    console.log('Retrieved summaries:', summaries);

    if (summaries.length === 2 && summaries[0] === 'Price returned to $120') {
        console.log('✅ PASS: Summary history preserved.');
    } else {
        console.log('❌ FAIL: Summary history mismatch.');
        process.exit(1);
    }
}

async function testGrooming() {
    console.log('\n2. Verifying Storage Grooming...');
    const state = new SnapshotManager('TEST-GROOMING');
    const url = 'https://old-site.com';

    await state.save(url, '<html>old content</html>');

    // Simulate old record by manually editing the store key (requires opening KVS)
    const store = await Actor.openKeyValueStore('TEST-GROOMING');
    const key = (state as any).urlToKey(url);
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

    await store.setValue(key, {
        html: '<html>old content</html>',
        timestamp: oldDate.toISOString()
    });

    console.log('Pruning records older than 30 days...');
    const pruned = await state.prune(30);
    console.log(`Pruned: ${pruned}`);

    if (pruned === 1) {
        console.log('✅ PASS: Storage grooming correctly identified and removed expired snapshot.');
    } else {
        console.log('❌ FAIL: Storage grooming failed to prune.');
        process.exit(1);
    }
}

await Actor.init();
await testHistory();
await testGrooming();
await Actor.exit();

console.log('\n🚀 God-Mode IS FULLY OPERATIONAL!');
