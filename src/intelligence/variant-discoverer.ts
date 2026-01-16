import * as cheerio from 'cheerio';

export class VariantDiscoverer {
    /**
     * sovereign: Variation Intelligence
     * Scans a landing page for links to different product versions.
     */
    static discover(html: string, baseUrl: string): string[] {
        const $ = cheerio.load(html);
        const variantUrls = new Set<string>();

        // 1. Amazon Specific Variation Links
        // Amazon often uses li.swatchAvailable or similar
        const amazonSelectors = [
            'li[data-dp-url] a',
            'li.swatchAvailable a',
            '#variation_color_name a',
            '#variation_size_name a',
            '#variation_style_name a'
        ];

        amazonSelectors.forEach(sel => {
            $(sel).each((_, el) => {
                const href = $(el).attr('href');
                if (href && href.includes('/dp/')) {
                    variantUrls.add(this.resolve(baseUrl, href));
                }
            });
        });

        // 2. Generic Variant Pattern (Buttons that link to different /products/)
        $('a').each((_, el) => {
            const text = $(el).text().toLowerCase();
            const href = $(el).attr('href');
            if (href && (text.includes('gb') || text.includes('tb') || text.includes('color'))) {
                // Heuristic: If it looks like a spec and it's a link, follow it
                variantUrls.add(this.resolve(baseUrl, href));
            }
        });

        return Array.from(variantUrls).filter(u => u !== baseUrl);
    }

    private static resolve(base: string, path: string): string {
        try {
            return new URL(path, base).href;
        } catch {
            return path;
        }
    }
}
