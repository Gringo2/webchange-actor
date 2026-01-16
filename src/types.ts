import { z } from 'zod';

/**
 * Actor Input Schema
 */
export const InputSchema = z.object({
    targetUrl: z.union([z.string().url(), z.array(z.string().url())]),
    preset: z.enum(['competitor-pricing', 'inventory-tracker', 'seo-intelligence', 'generic']).default('competitor-pricing'),
    cssSelector: z.string().optional(),
    useVisualProof: z.boolean().default(false),
    discoverVariants: z.boolean().default(false), // Sovereign: Multi-variant tracking
    minSeverityToAlert: z.number().int().min(0).max(100).default(40),
    useAi: z.boolean().default(false),
    enableHealing: z.boolean().default(true), // Sovereign: Enable Self-Correcting Selectors
    generateDashboard: z.boolean().default(true), // Victory Lap: Premium HTML Report
    openaiApiKey: z.string().optional(),
    aiModel: z.string().default('gpt-4-turbo-preview'),
    customWebhookUrl: z.string().url().optional(),
    // Legacy mapping support
    aiOptions: z.object({
        provider: z.enum(['openai', 'anthropic']).default('openai'),
        model: z.string().optional(),
        apiKey: z.string().optional(),
    }).optional(),
    notificationConfig: z.object({
        webhookUrl: z.string().url(),
        authHeader: z.string().optional(),
    }).optional(),
    proxyConfiguration: z.object({}).passthrough().optional(),
    slackWebhookUrl: z.string().url().optional(),
    discordWebhookUrl: z.string().url().optional(),
    waitForSelector: z.string().optional(),
    // V2 specific
    historyDepth: z.number().int().min(1).max(20).default(5),
    cooldownPeriodMinutes: z.number().int().min(0).default(60),
    storageGroomingDays: z.number().int().min(1).default(30),
});

export type ActorInput = z.infer<typeof InputSchema>;

/**
 * Preset configuration
 */
export interface PresetConfig {
    id: string;
    rules: {
        includeSelectors: string[];
        excludeSelectors: string[];
        keywords?: string[]; // Keywords to boost severity score
    };
    aiPrompt?: string;
}

/**
 * Structured Diff Item
 */
export interface DiffItem {
    path: string;
    selector: string;
    context?: string; // Semantic context (text)
    contextPath?: string; // DOM path of the context identifier
    old: string | null;
    new: string | null;
    type: 'added' | 'removed' | 'modified';
}

/**
 * Final Analysis Result for Output/Notifications
 */
export interface AnalysisResult {
    url: string;
    timestamp: string;
    changeType: 'content_added' | 'content_removed' | 'content_modified' | 'structure_change' | 'no_change';
    severityScore: number;
    diffSummary: {
        text: string;
        structured: DiffItem[];
    };
    aiAnalysis?: {
        summary: string;
        reasoning: string;
        recommendation?: string; // Strategic Business Advice
        pattern?: string; // God-Mode: Pattern Recognition
    };
    screenshotUrl?: string;
    // Sovereign: Self-Correction Data
    autoHealedSelector?: string;
    // Spreadsheet-Optimized (Flat) Fields
    productName?: string;
    oldPrice?: number;
    newPrice?: number;
    changePercent?: number;
    priceHistory?: number[]; // Sovereign: Trend visualization
    variantGroup?: string; // Grouping key for variants (e.g. "iPhone 15")
    // Stock Status
    isAvailable?: boolean;
    stockStatus?: 'in_stock' | 'out_of_stock' | 'unavailable' | 'unknown';
    v2?: any;
}

export interface RunStats {
    total: number;
    changed: number;
    filtered: number;
    failed: number;
    durationMs?: number;
    healed?: number; // Sovereign: Number of healed selectors
    dashboardUrl?: string; // Victory Lap: Link to generated KVS report
}
