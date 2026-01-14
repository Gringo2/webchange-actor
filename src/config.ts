import { ActorInput, PresetConfig } from './types.js';

export const PRESETS: Record<string, PresetConfig> = {
    pricing: {
        id: 'pricing',
        rules: {
            includeSelectors: ['.price', '.amount', '[itemprop="price"]', '.offer', '.product-price'],
            excludeSelectors: ['.related-products', '.ads', 'nav', 'footer'],
            keywords: ['price', 'cost', 'save', 'discount', 'off', 'subscription', 'monthly', 'yearly'],
        },
        aiPrompt: 'Focus on price changes, currency adjustments, or discount removal.',
    },
    policy: {
        id: 'policy',
        rules: {
            includeSelectors: ['main', 'article', '.content', '.legal', '.terms', '.privacy'],
            excludeSelectors: ['nav', 'footer', '.cookie-banner', '.social-links'],
            keywords: ['liability', 'terms', 'agree', 'rights', 'privacy', 'effective date', 'amendment'],
        },
        aiPrompt: 'Analyze updates in legal terms, liability shifts, or privacy changes. High severity for text removals in critical paragraphs.',
    },
    competitor: {
        id: 'competitor',
        rules: {
            includeSelectors: ['h1', 'h2', '.product-title', '.features', '.pricing', '.badge'],
            excludeSelectors: ['nav', 'footer', '.suggested-content'],
            keywords: ['new', 'launch', 'beta', 'sold out', 'upcoming', 'upgrade', 'integrates'],
        },
        aiPrompt: 'Detect new product feature announcements, status changes like "Sold Out" or "In Stock", and version updates.',
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
    preset: 'generic',
    useAi: false,
    historyDepth: 5,
    cooldownPeriodMinutes: 60,
};
