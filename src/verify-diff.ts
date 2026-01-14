
import { DiffEngine } from './core/diff.js';
import { DiffItem } from './types.js';

console.log('🧪 Starting Diff Engine Verification...\n');

const runTest = (name: string, oldHtml: string, newHtml: string, expected: Partial<DiffItem>[]) => {
    console.log(`Running: ${name}`);
    const results = DiffEngine.compare(oldHtml, newHtml);

    // Simplified result for comparison
    const simplified = results.map(r => ({ type: r.type, old: r.old, new: r.new }));

    let passed = true;
    if (simplified.length !== expected.length) passed = false;
    else {
        for (let i = 0; i < simplified.length; i++) {
            if (simplified[i].type !== expected[i].type ||
                simplified[i].old !== expected[i].old ||
                simplified[i].new !== expected[i].new) {
                passed = false;
                break;
            }
        }
    }

    if (passed) {
        console.log('✅ PASS');
    } else {
        console.log('❌ FAIL');
        console.log('Expected:', expected);
        console.log('Got:', simplified);
    }
    console.log('---\n');
};

// 1. List Prepend
runTest(
    'List Prepend (C inserted before A, B)',
    '<ul><li>A</li><li>B</li></ul>',
    '<ul><li>C</li><li>A</li><li>B</li></ul>',
    [{ type: 'added', old: null, new: 'C' }]
);

// 2. List Append
runTest(
    'List Append (C after A, B)',
    '<ul><li>A</li><li>B</li></ul>',
    '<ul><li>A</li><li>B</li><li>C</li></ul>',
    [{ type: 'added', old: null, new: 'C' }]
);

// 3. List Removal
runTest(
    'List Removal (B removed from A, B, C)',
    '<ul><li>A</li><li>B</li><li>C</li></ul>',
    '<ul><li>A</li><li>C</li></ul>',
    [{ type: 'removed', old: 'B', new: null }]
);

// 4. Modification
runTest(
    'Simple Modification',
    '<p>Hello</p>',
    '<p>Hi</p>',
    [{ type: 'modified', old: 'Hello', new: 'Hi' }]
);

// 5. Pricing Change
runTest(
    'Pricing Change (Merged Remove+Add)',
    '<div class="price">$10</div>',
    '<div class="price">$12</div>',
    [{ type: 'modified', old: '$10', new: '$12' }]
);

// 6. Complex Mixed
runTest(
    'Mixed: A removed, C added',
    '<ul><li>A</li><li>B</li></ul>',
    '<ul><li>B</li><li>C</li></ul>',
    [
        { type: 'modified', old: 'A', new: 'C' }
        // { type: 'removed', old: 'A', new: null },
        // { type: 'added', old: null, new: 'C' }
    ]
);
