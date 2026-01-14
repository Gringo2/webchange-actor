import * as cheerio from 'cheerio';
import { DiffItem, PresetConfig } from '../types.js';

export class DiffEngine {
    /**
     * Structural diff between two HTML snippets using LCS (Longest Common Subsequence).
     * This handles list insertions and removals much better than index-based comparison.
     */
    static compare(oldHtml: string, newHtml: string, preset?: PresetConfig): DiffItem[] {
        const $old = cheerio.load(oldHtml) as any;
        const $new = cheerio.load(newHtml) as any;
        const diffs: DiffItem[] = [];

        // Extract text nodes with their path and semantic context
        const extractNodes = (selector: string, $: cheerio.CheerioAPI) => {
            const results: { path: string; text: string; context?: string; contextPath?: string }[] = [];
            $(selector).each((i, el) => {
                const $el = $(el);

                // Find nearest identifying text (context)
                // We look for the nearest heading or specific identifying attribute
                let context: string | undefined;
                let contextPath: string | undefined;
                let $parent = $el.parent();
                const maxDepth = 5;
                for (let d = 0; d < maxDepth && $parent.length > 0; d++) {
                    const $headings = $parent.find('h1, h2, h3, h4, h5, h6');
                    if ($headings.length > 0) {
                        const $heading = $headings.first();
                        context = $heading.text().trim();
                        // Construct a simple path for the context element
                        const headingEl = $heading[0];
                        if (headingEl) {
                            contextPath = `${(headingEl as any).name}`;
                            // Add index if there are multiple siblings of the same tag
                            const siblings = $heading.siblings((headingEl as any).name);
                            if (siblings.length > 0) {
                                const index = $heading.index((headingEl as any).name);
                                if (index !== -1) {
                                    contextPath += `[${index}]`;
                                }
                            }
                        }
                        break;
                    }
                    $parent = $parent.parent();
                }

                results.push({
                    path: `${(el as any).name}[${i}]`,
                    text: $el.text().trim(),
                    context,
                    contextPath
                });
            });
            return results;
        };

        // Use preset-specific selectors if available, otherwise use default comprehensive set
        const selectorsToWatch = preset?.rules.includeSelectors.length
            ? [...new Set([...preset.rules.includeSelectors, 'h1', 'h2', 'h3', 'p', 'li'])]
            : ['h1', 'h2', 'h3', 'p', '.price', '.amount', 'li'];

        selectorsToWatch.forEach(sel => {
            const oldNodes = extractNodes(sel, $old);
            const newNodes = extractNodes(sel, $new);

            // Perform LCS-based Diff
            const changes = this.computeLCSDiff(oldNodes, newNodes, sel);
            diffs.push(...changes);
        });

        return diffs;
    }

    /**
     * Computes the Longest Common Subsequence and derives the diff.
     */
    private static computeLCSDiff(
        oldNodes: { path: string; text: string; context?: string }[],
        newNodes: { path: string; text: string; context?: string }[],
        selector: string
    ): DiffItem[] {
        const m = oldNodes.length;
        const n = newNodes.length;

        // 1. Build LCS Matrix
        const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (oldNodes[i - 1].text === newNodes[j - 1].text) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // 2. Backtrack to find the diff
        const diffs: DiffItem[] = [];
        let i = m;
        let j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldNodes[i - 1].text === newNodes[j - 1].text) {
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                diffs.unshift({
                    path: newNodes[j - 1].path,
                    selector,
                    context: newNodes[j - 1].context,
                    old: null,
                    new: newNodes[j - 1].text,
                    type: 'added'
                });
                j--;
            } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
                diffs.unshift({
                    path: oldNodes[i - 1].path,
                    selector,
                    context: oldNodes[i - 1].context,
                    old: oldNodes[i - 1].text,
                    new: null,
                    type: 'removed'
                });
                i--;
            }
        }

        // 3. Post-process to detect 'modified'
        const mergedDiffs: DiffItem[] = [];
        for (let k = 0; k < diffs.length; k++) {
            const current = diffs[k];
            const next = diffs[k + 1];

            if (current.type === 'removed' && next && next.type === 'added') {
                mergedDiffs.push({
                    path: next.path,
                    selector,
                    context: next.context || current.context,
                    old: current.old,
                    new: next.new,
                    type: 'modified'
                });
                k++;
            } else {
                mergedDiffs.push(current);
            }
        }

        return mergedDiffs;
    }
}
