import { z } from 'zod';

/**
 * Actor Input Schema
 */
export const InputSchema = z.object({
    targetUrl: z.union([z.string().url(), z.array(z.string().url())]),
    preset: z.enum(['competitor-pricing', 'inventory-tracker', 'seo-intelligence', 'generic']).default('competitor-pricing'),
    cssSelector: z.string().optional(),
    useVisualProof: z.boolean().default(false),
    minSeverityToAlert: z.number().int().min(0).max(100).default(40),
    useAi: z.boolean().default(false),
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
    // V2 specific
    historyDepth: z.number().int().min(1).max(20).default(5),
    cooldownPeriodMinutes: z.number().int().min(0).default(60),
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
    changeType: 'major' | 'minor' | 'none';
    severityScore: number;
    diffSummary: {
        text: string;
        structured: DiffItem[];
    };
    aiAnalysis?: {
        summary: string;
        reasoning: string;
    };
    screenshotUrl?: string;
}
