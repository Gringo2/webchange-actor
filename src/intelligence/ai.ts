import { OpenAI } from 'openai';
import { Actor, log } from 'apify';
import { DiffItem, PresetConfig } from '../types.js';

export interface AIInterpreterOptions {
    apiKey: string;
    model?: string;
}

export class AIInterpreter {
    private openai: OpenAI;
    private model: string;

    constructor(options: AIInterpreterOptions) {
        this.openai = new OpenAI({ apiKey: options.apiKey });
        this.model = options.model || 'gpt-4-turbo-preview';
    }

    async analyze(
        diffs: DiffItem[],
        preset: PresetConfig,
        historySummaries: string[] = []
    ): Promise<{ summary: string; reasoning: string; recommendation?: string; pattern?: string }> {
        if (diffs.length === 0) {
            return { summary: 'No changes detected.', reasoning: 'The page content is identical to the previous snapshot.' };
        }

        const sampledDiffs = diffs.slice(0, 10).map(d => ({
            selector: d.selector,
            context: d.context,
            type: d.type,
            old: d.old?.substring(0, 100),
            new: d.new?.substring(0, 100),
        }));

        const historyContext = historySummaries.length > 0
            ? `\nRecent Change History:\n${historySummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
            : '';

        const prompt = `
            You are a world-class strategic intelligence analyst.
            Target Preset: ${preset.id}
            Context: ${preset.aiPrompt || 'General monitoring'}
            ${historyContext}
            
            Current Diff Data:
            ${JSON.stringify(sampledDiffs, null, 2)}
            
            Task:
            1. Summarize today's changes in one executive sentence.
            2. Evaluate business impact and reasoning.
            3. Provide a Strategic Action Recommendation.
            4. Pattern Recognition: If history is provided, analyze recursive trends (e.g., "They alternate prices every 3 days" or "Weekend flash sale detected").
            
            Return ONLY a JSON object: { "summary": "...", "reasoning": "...", "recommendation": "...", "pattern": "..." }
        `;

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0,
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content || '{}');
        } catch (error) {
            log.error(`AI Analysis failed: ${(error as Error).message}`);
            return {
                summary: 'AI analysis unavailable.',
                reasoning: 'An error occurred while communicating with the AI provider.',
            };
        }
    }

    /**
     * Sovereign: Semantic Healing logic.
     * Finds a new CSS selector if the original one breaks.
     */
    async healSelector(oldSelector: string, semanticContext: string, htmlSample: string): Promise<string | null> {
        log.info(`🩹 Semantic Healing: Searching for replacement for broken selector '${oldSelector}'...`);

        const prompt = `
            You are a DOM Repair Expert for SWIM.
            
            PROBLEM:
            A website changed its structure. The previous CSS selector '${oldSelector}' is NO LONGER VALID.
            We were tracking an element described as: "${semanticContext}"
            
            SAMPLED HTML (New Structure):
            ${htmlSample.substring(0, 4000)}
            
            TASK:
            1. Analyze the HTML to find the element that most likely represents "${semanticContext}".
            2. Generate a valid, specific CSS selector for THIS element.
            3. Return ONLY a JSON object with the 'healedSelector' field.
            
            Return ONLY a JSON object: { "healedSelector": ".new-price-class", "confidence": 0.95 }
        `;

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0,
            });

            const content = JSON.parse(response.choices[0].message.content || '{}');
            return content.healedSelector || null;
        } catch (error) {
            log.error(`Semantic Healing failed: ${(error as Error).message}`);
            return null;
        }
    }
}
