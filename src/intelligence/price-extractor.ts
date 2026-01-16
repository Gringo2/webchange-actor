import { log } from 'apify';
import * as cheerio from 'cheerio';

export class PriceExtractor {
    /**
     * sovereign: Elite Price Discovery
     * Uses heuristics and weighting to find the MOST LIKELY product price.
     */
    static extract(html: string, targetSelector?: string): number | undefined {
        const $ = cheerio.load(html);
        const candidates: { price: number; score: number }[] = [];

        // 1. Target Selector (Highest Priority)
        if (targetSelector) {
            const text = $(targetSelector).first().text().trim();
            const price = this.parseNumericPrice(text);
            if (price) candidates.push({ price, score: 100 });
        }

        // 2. Semantic E-commerce Selectors (High Priority)
        const semanticSelectors = [
            '[itemprop="price"]',
            '.a-price-whole', // Amazon
            '.price',
            '.special-price',
            '.product-price',
            '.price-current',
            '.current-price'
        ];

        semanticSelectors.forEach(sel => {
            $(sel).each((_, el) => {
                const price = this.parseNumericPrice($(el).text());
                if (price) candidates.push({ price, score: 80 });
            });
        });

        // 3. Global Text Scan (Lower Priority)
        // We look for currency patterns and score them by magnitude and proximity
        const bodyText = $('body').text();
        const matches = bodyText.match(/\$[\d,]+(?:\.\d+)?/g) || [];

        matches.forEach(match => {
            const price = this.parseNumericPrice(match);
            if (price) {
                // Heuristic: Real product prices are rarely < $5 for electronics
                // and we want to avoid $10 coupons.
                let score = 50;
                if (price < 1) score = 5;
                if (price >= 1 && price < 20) score = 30; // Suspiciously low for "iPhone"
                if (price >= 20 && price < 5000) score = 60;

                candidates.push({ price, score });
            }
        });

        if (candidates.length === 0) return undefined;

        // Sort by score (desc) and then magnitude (desc) - usually the primary price is the largest visible one
        const winner = candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.price - a.price;
        })[0];

        log.debug(`🔎 Price Discovery: Found ${candidates.length} candidates. Winner: $${winner.price}`);
        return winner.price;
    }

    private static parseNumericPrice(val: string | null): number | undefined {
        if (!val) return undefined;
        // Clean up common noise around the number
        const matches = val.match(/(?:\$\s?)([0-9,]+(?:\.[0-9]{1,2})?)/) ||
            val.match(/([0-9,]+\.[0-9]{2})/) ||
            val.match(/([0-9,]+)/);
        if (!matches) return undefined;
        const num = parseFloat(matches[1].replace(/,/g, ''));
        return (isNaN(num) || num <= 0 || num > 1000000) ? undefined : num;
    }
}
