import { DiffItem, PresetConfig } from '../types.js';

export class SemanticClassifier {
    /**
     * Classifies a set of diffs into a semantic category.
     */
    static classify(diffs: DiffItem[], preset: PresetConfig): 'content_added' | 'content_removed' | 'content_modified' | 'structure_change' | 'no_change' {
        if (diffs.length === 0) return 'no_change';

        const types = diffs.map(d => d.type);
        const hasAddition = types.includes('added');
        const hasRemoval = types.includes('removed');
        const hasModification = types.includes('modified');

        // Rule-based classification
        if (hasModification) return 'content_modified';
        if (hasAddition && hasRemoval) return 'content_modified'; // Net modification
        if (hasAddition) return 'content_added';
        if (hasRemoval) return 'content_removed';

        return 'structure_change';
    }

    /**
     * Checks if a diff item contains any of the preset keywords.
     */
    static matchesKeywords(diff: DiffItem, keywords: string[]): boolean {
        const text = `${diff.old || ''} ${diff.new || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw.toLowerCase()));
    }
}
