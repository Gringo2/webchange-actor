import { z } from 'zod';

/**
 * Actor Input Schema
 */
export const InputSchema = z.object({
    targetUrl: z.string().url(),
    preset: z.enum(['competitor-pricing', 'inventory-tracker', 'seo-intelligence', 'generic']).default('competitor-pricing'),
    cssSelector: z.string().optional(),
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
    // V2 specific
    historyDepth: z.number().int().min(1).max(20).default(5),
    cooldownPeriodMinutes: z.number().int().min(0).default(60),
});

export type ActorInput = z.infer<typeof InputSchema>;

/**
 * Internal Preset Configuration
 */
export interface PresetConfig {
    id: string;
    rules: {
        includeSelectors: string[];
        excludeSelectors: string[];
        keywords: string[];
    };
    aiPrompt?: string;
}

/**
 * Structured Diff Item
 */
export interface DiffItem {
    path: string;
    selector: string;
    old: string | null;
    new: string | null;
    type: 'added' | 'removed' | 'modified';
}

/**
 * Final Analysis Result
 */
export interface AnalysisResult {
    url: string;
    timestamp: string;
    changeDetected: boolean;
    severityScore: number;
    changeType: 'content_added' | 'content_removed' | 'content_modified' | 'structure_change' | 'no_change';
    diffSummary: {
        text: string;
        structured: DiffItem[];
    };
    aiAnalysis?: {
        summary: string;
        reasoning: string;
    };
    v2?: {
        isDuplicate: boolean;
        deduplicationHash: string;
        historyDepth: number;
        relatedSnapshots: string[];
        reasons: string[];
    };
}
