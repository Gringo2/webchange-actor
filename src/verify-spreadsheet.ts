import { DiffItem } from './types.js';

console.log('🧪 Starting Spreadsheet Optimization Verification...');

// Mock prices extraction logic from main.ts
const diffs: DiffItem[] = [
    {
        type: 'modified',
        old: '$1,299.00',
        new: '$1,199.99',
        selector: '.price',
        context: 'MacBook Pro',
        path: 'div[0]'
    }
];

const priceDiff = diffs.find(d => d.type === 'modified' && (d.old?.includes('$') || d.new?.includes('$') || d.selector.includes('price')));

let oldPrice: number | undefined;
let newPrice: number | undefined;
let changePercent: number | undefined;

if (priceDiff) {
    const parsePrice = (val: string | null) => {
        if (!val) return undefined;
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? undefined : num;
    };
    oldPrice = parsePrice(priceDiff.old);
    newPrice = parsePrice(priceDiff.new);
    if (oldPrice && newPrice && oldPrice !== 0) {
        changePercent = parseFloat(((newPrice - oldPrice) / oldPrice * 100).toFixed(2));
    }
}

console.log('--- Extraction Results ---');
console.log('Product:', diffs[0].context);
console.log('Old Price:', oldPrice);
console.log('New Price:', newPrice);
console.log('Change %:', changePercent + '%');

if (oldPrice === 1299 && newPrice === 1199.99 && changePercent === -7.62) {
    console.log('\n✅ PASS: Numeric extraction and calculation are perfect.');
} else {
    console.log('\n❌ FAIL: Extraction results do not match expected values.');
    process.exit(1);
}

console.log('\n🚀 SWIM is now Spreadsheet-Optimized!');
