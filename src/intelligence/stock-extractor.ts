import * as cheerio from 'cheerio';

export class StockExtractor {
    /**
     * sovereign: Elite Stock Discovery
     * Detects if an item is available for purchase.
     */
    static extract(html: string): { isAvailable: boolean; status: 'in_stock' | 'out_of_stock' | 'unavailable' | 'unknown' } {
        const $ = cheerio.load(html);
        const text = $('body').text().toLowerCase();

        // 1. "Currently Unavailable" Check (Most common for Amazon)
        if (text.includes('currently unavailable') ||
            text.includes("we don't know when or if this item will be back in stock")) {
            return { isAvailable: false, status: 'unavailable' };
        }

        // 2. "Out of Stock" Check
        if (text.includes('out of stock') ||
            text.includes('temporarily out of stock') ||
            text.includes('vendu out') || // French
            text.includes('agotado')) { // Spanish
            return { isAvailable: false, status: 'out_of_stock' };
        }

        // 3. Button Check (If "Add to Cart" or "Buy Now" exists, it's probably in stock)
        const buyButtons = [
            '#add-to-cart-button',
            '#buy-now-button',
            '.add-to-cart',
            '.btn-add-to-cart',
            '[aria-label="Add to cart"]',
            'button:contains("Add to Cart")',
            'button:contains("Buy Now")'
        ].some(sel => $(sel).length > 0);

        if (buyButtons) {
            return { isAvailable: true, status: 'in_stock' };
        }

        // 4. Fallback: If no price AND no buttons, likely unavailable
        return { isAvailable: false, status: 'unknown' };
    }
}
