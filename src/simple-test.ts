import { Scorer } from './core/scorer.js';
import { PresetConfig, DiffItem } from './types.js';

const mockPreset: PresetConfig = {
    id: 'test',
    rules: {
        includeSelectors: ['.price'],
        excludeSelectors: [],
        keywords: ['sale']
    }
};

const mockDiffs: DiffItem[] = [
    { path: 'span[0]', selector: '.price', old: '$10', new: '$20', type: 'modified' }
];

const { score, reasons } = Scorer.calculateSeverity(mockDiffs, mockPreset);
console.log(`Score: ${score}`);
console.log(`Reasons: ${JSON.stringify(reasons)}`);
