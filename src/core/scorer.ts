import { DiffItem, PresetConfig } from '../types.js';
import { SemanticClassifier } from './classifier.js';

export class Scorer {
    /**
     * Calculates a severity score (0-100) based on the diffs and preset rules.
     */
    static calculateSeverity(diffs: DiffItem[], preset: PresetConfig): { score: number; reasons: string[] } {
        if (diffs.length === 0) return { score: 0, reasons: [] };

        let score = 0;
        const reasons = new Set<string>();

        diffs.forEach(diff => {
            let itemScore = 0;

            // 1. Location-based scoring (Selector weights)
            if (preset.rules.includeSelectors.some(s => diff.selector.includes(s))) {
                itemScore += 40;
                reasons.add(`High-priority selector matched: ${diff.selector}`);
            } else {
                itemScore += 10;
            }

            // 2. Keyword-based scoring
            if (SemanticClassifier.matchesKeywords(diff, preset.rules.keywords)) {
                itemScore += 30;
                reasons.add(`Critical keyword match found in: ${diff.path}`);
            }

            // 3. Numeric change detection
            if (this.isNumericChange(diff.old, diff.new)) {
                itemScore += 20;
                reasons.add(`Numeric value change detected: ${diff.old} -> ${diff.new}`);
            }

            score = Math.max(score, itemScore);
        });

        return {
            score: Math.min(score, 100),
            reasons: Array.from(reasons),
        };
    }

    private static isNumericChange(oldVal: string | null, newVal: string | null): boolean {
        if (!oldVal || !newVal) return false;

        const oldNum = oldVal.replace(/[^0-9.]/g, '');
        const newNum = newVal.replace(/[^0-9.]/g, '');

        return oldNum !== '' && newNum !== '' && oldNum !== newNum;
    }
}
