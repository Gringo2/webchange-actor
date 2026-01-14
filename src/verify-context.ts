import { DiffEngine } from './core/diff.js';
import { PRESETS } from './config.js';

const oldHtml = `
<div class="product">
    <h2>iPhone 15</h2>
    <p class="price">$799</p>
</div>
<div class="product">
    <h2>iPhone 15 Pro</h2>
    <p class="price">$999</p>
</div>
`;

const newHtml = `
<div class="product">
    <h2>iPhone 15</h2>
    <p class="price">$799</p>
</div>
<div class="product">
    <h2>iPhone 15 Pro</h2>
    <p class="price">$949</p>
</div>
`;

const diffs = DiffEngine.compare(oldHtml, newHtml, PRESETS['competitor-pricing']);

console.log('--- Product Context Verification ---');
diffs.forEach(d => {
    console.log(`Type: ${d.type}`);
    console.log(`Selector: ${d.selector}`);
    console.log(`Context (Product Name): ${d.context || 'MISSING'}`);
    console.log(`Change: ${d.old} -> ${d.new}`);
    console.log('---');
});

if (diffs.some(d => d.context === 'iPhone 15 Pro')) {
    console.log('✅ SUCCESS: Context correctly attributed to iPhone 15 Pro.');
} else {
    console.log('❌ FAILURE: Context was not correctly identified.');
    process.exit(1);
}
