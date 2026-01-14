import { ActorInput, PresetConfig } from './types.js';

export const PRESETS: Record<string, PresetConfig> = {
    'competitor-pricing': {
        id: 'competitor-pricing',
        rules: {
            includeSelectors: ['.price', '.amount', '[itemprop="price"]', '.offer', '.product-price', '.discount', '.fare'],
            excludeSelectors: ['.related-products', '.ads', 'nav', 'footer', '.menu', '.cookie-banner'],
            keywords: ['price', 'cost', 'save', 'discount', 'off', 'subscription', 'monthly', 'yearly', 'sale'],
        },
        aiPrompt: 'Focus on price changes, currency adjustments, or discount removal. Ignore minor layout shifts.',
    },
    /*
    'compliance-monitor': {
        id: 'compliance-monitor',
        rules: {
            includeSelectors: ['main', 'article', '.content', '.legal', '.terms', '.privacy'],
            excludeSelectors: ['nav', 'footer', '.cookie-banner', '.social-links'],
            keywords: ['liability', 'terms', 'agree', 'rights', 'privacy', 'effective date', 'amendment'],
        },
        aiPrompt: 'Analyze updates in legal terms, liability shifts, or privacy changes. High severity for text removals in critical paragraphs.',
    },
    */
    'inventory-tracker': {
        id: 'inventory-tracker',
        rules: {
            includeSelectors: ['h1', 'h2', '.product-title', '.features', '.pricing', '.badge', '.stock-status', '.availability'],
            excludeSelectors: ['nav', 'footer', '.suggested-content'],
            keywords: ['new', 'launch', 'beta', 'sold out', 'upcoming', 'upgrade', 'integrates', 'in stock', 'out of stock'],
        },
        aiPrompt: 'Detect inventory status changes (In Stock/Sold Out), new product feature announcements, and version updates.',
    },
    'seo-intelligence': {
        id: 'seo-intelligence',
        rules: {
            includeSelectors: ['title', 'meta[name="description"]', 'h1', 'link[rel="canonical"]'],
            excludeSelectors: [],
            keywords: ['seo', 'title', 'meta', 'description', 'canonical', 'optimized'],
        },
        aiPrompt: 'Analyze changes in SEO-critical tags (Title, Meta Description, H1). Highlight new keywords or truncated text.',
    },
    generic: {
        id: 'generic',
        rules: {
            includeSelectors: ['body'],
            excludeSelectors: ['script', 'style', 'noscript', 'svg', 'header', 'footer', 'nav', '.menu', '.ads'],
            keywords: [],
        },
    },
};

export const DEFAULT_INPUT: Partial<ActorInput> = {
    preset: 'competitor-pricing',
    useAi: false,
    historyDepth: 5,
    cooldownPeriodMinutes: 60,
};
