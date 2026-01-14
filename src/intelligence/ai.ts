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

    async analyze(diffs: DiffItem[], preset: PresetConfig): Promise<{ summary: string; reasoning: string }> {
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

        const prompt = `
            You are a semantic web change analyst for SWIM (Semantic Web Intelligent Monitor). 
            Target Preset: ${preset.id}
            Context: ${preset.aiPrompt || 'General monitoring'}
            
            Diff Data (includes context labels if found):
            ${JSON.stringify(sampledDiffs, null, 2)}
            
            Task:
            1. Summarize the changes in one sentence. Use the "context" field to identify specifically which product or section changed.
            2. Provide the reasoning/importance of these changes.
            
            Return ONLY a JSON object: { "summary": "...", "reasoning": "..." }
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
}
