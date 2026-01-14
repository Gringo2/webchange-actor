import * as cheerio from 'cheerio';

export interface PreprocessorOptions {
    excludeSelectors?: string[];
}

export class Preprocessor {
    /**
     * Cleans and normalizes HTML content for reliable diffing.
     */
    static normalize(html: string, options: PreprocessorOptions = {}): string {
        const $ = cheerio.load(html);

        // 1. Remove noise elements (scripts, styles, ads)
        const noise = ['script', 'style', 'noscript', 'svg', 'iframe', 'ins', 'ad', '.ads', '.ad-unit', ...(options.excludeSelectors || [])];
        noise.forEach(selector => $(selector).remove());

        // 2. Signal Normalization
        $('*').each((_, el) => {
            const element = $(el);

            // A. Attribute Stripping: Remove dynamic attributes that change per request
            const attrsToRemove = [
                /^data-react/i, /^data-v-/i, /^data-uid/i,
                /^data-id/i, /^data-test/i, 'onclick',
                'onmouseover', 'onload', 'onscroll'
            ];

            const attribs = (el as any).attribs || {};
            Object.keys(attribs).forEach(attr => {
                if (attrsToRemove.some(regex => typeof regex === 'string' ? regex === attr : regex.test(attr))) {
                    element.removeAttr(attr);
                }
            });

            // B. Class Sorting: Ensure class order doesn't trigger false diffs
            const classList = element.attr('class');
            if (classList) {
                const sortedClasses = classList.split(/\s+/).filter(Boolean).sort().join(' ');
                if (sortedClasses) {
                    element.attr('class', sortedClasses);
                } else {
                    element.removeAttr('class');
                }
            }

            // C. Tag Pruning: Remove empty tags that serve no semantic purpose
            if (element.children().length === 0 && !element.text().trim() && !['br', 'hr', 'img', 'input'].includes((el as any).name)) {
                element.remove();
            }
        });

        // 3. Whitespace Standardization
        // Convert to string and collapse multiple spaces/newlines
        let cleaned = $.html();
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    /**
     * Extracts plain text for semantic analysis.
     */
    static extractText(html: string): string {
        const $ = cheerio.load(html);
        return $('body').text().replace(/\s+/g, ' ').trim();
    }
}
