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

        // Extract text nodes with their path for identification
        const extractNodes = (selector: string, $: cheerio.CheerioAPI) => {
            const results: { path: string; text: string }[] = [];
            $(selector).each((i, el) => {
                const $el = $(el);
                results.push({
                    path: `${(el as any).name}[${i}]`,
                    text: $el.text().trim()
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
        oldNodes: { path: string; text: string }[],
        newNodes: { path: string; text: string }[],
        selector: string
    ): DiffItem[] {
        const m = oldNodes.length;
        const n = newNodes.length;

        // 1. Build LCS Matrix
        // dp[i][j] stores the length of LCS of oldNodes[0..i-1] and newNodes[0..j-1]
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
                // Match - No change
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                // Added in new (Move Left in matrix, but we are backtracking, so effectively up/left logic depends on orientation)
                // If we came from Left (dp[i][j-1]), it means newNodes[j-1] was added.
                // Correct backtrack logic:
                // If dp[i][j] comes from dp[i][j-1], it means character j was inserted.
                diffs.unshift({
                    path: newNodes[j - 1].path,
                    selector,
                    old: null,
                    new: newNodes[j - 1].text,
                    type: 'added'
                });
                j--;
            } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
                // Removed from old (Move Up)
                diffs.unshift({
                    path: oldNodes[i - 1].path,
                    selector,
                    old: oldNodes[i - 1].text,
                    new: null,
                    type: 'removed'
                });
                i--;
            }
        }

        // 3. Post-process to detect 'modified' (optional but good for UX)
        // If we see an Removed immediately followed by an Added (or vice versa) at similar position, 
        // we could coalesce them into 'modified'. 
        // For strict LCS, they are separate. V1 users might prefer 'modified' if it's the "same" node.
        // However, since we track by index in the path extraction (div[0]), path matching isn't stable across inserts.
        // So we will stick to pure Add/Remove for structural changes, which is more honest.
        // BUT, for pricing ($10 -> $12), LCS sees "no common subsequence", so it would be Remove $10, Add $12.
        // We arguably want to pair them if they align.

        // Simple heuristic: If we have [Remove Old, Add New] at the end of the diff list, merge them.
        const mergedDiffs: DiffItem[] = [];
        for (let k = 0; k < diffs.length; k++) {
            const current = diffs[k];
            const next = diffs[k + 1];

            if (current.type === 'removed' && next && next.type === 'added') {
                // Check if they look like a modification (same selector, maybe even same path index if naive)
                // For now, let's merge them to preserve the 'modified' semantics users like for prices.
                mergedDiffs.push({
                    path: next.path, // Use new path
                    selector,
                    old: current.old,
                    new: next.new,
                    type: 'modified'
                });
                k++; // Skip next
            } else {
                mergedDiffs.push(current);
            }
        }

        return mergedDiffs;
    }
}
