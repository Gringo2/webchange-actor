import * as cheerio from 'cheerio';
import { DiffItem } from '../types.js';

export class DiffEngine {
    /**
     * Simple structural diff between two HTML snippets.
     * Note: This is a V1 implementation focusing on changed nodes.
     */
    static compare(oldHtml: string, newHtml: string): DiffItem[] {
        const $old = cheerio.load(oldHtml) as any;
        const $new = cheerio.load(newHtml) as any;
        const diffs: DiffItem[] = [];

        // This is a naive but effective recursive comparison for V1
        // In a more advanced version, we would use a proper DOM diff algorithm

        // For V1, we will focus on comparing text content change in identifiable blocks
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

        const selectorsToWatch = ['h1', 'h2', 'h3', 'p', '.price', '.amount', 'li'];

        selectorsToWatch.forEach(sel => {
            const oldNodes = extractNodes(sel, $old);
            const newNodes = extractNodes(sel, $new);

            // Compare one by one
            const max = Math.max(oldNodes.length, newNodes.length);
            for (let i = 0; i < max; i++) {
                const oldN = oldNodes[i];
                const newN = newNodes[i];

                if (!oldN && newN) {
                    diffs.push({ path: newN.path, selector: sel, old: null, new: newN.text, type: 'added' });
                } else if (oldN && !newN) {
                    diffs.push({ path: oldN.path, selector: sel, old: oldN.text, new: null, type: 'removed' });
                } else if (oldN.text !== newN.text) {
                    diffs.push({ path: newN.path, selector: sel, old: oldN.text, new: newN.text, type: 'modified' });
                }
            }
        });

        return diffs;
    }
}
