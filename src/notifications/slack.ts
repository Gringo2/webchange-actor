import { gotScraping } from 'got-scraping';
import { AnalysisResult } from '../types.js';
import { log } from 'apify';

export class SlackNotifier {
    private webhookUrl: string;

    constructor(webhookUrl: string) {
        this.webhookUrl = webhookUrl;
    }

    async send(result: AnalysisResult): Promise<void> {
        try {
            const payload = this.formatPayload(result);
            await gotScraping.post(this.webhookUrl, {
                json: payload,
                responseType: 'json',
            });
            log.info('✅ Slack notification sent successfully.');
        } catch (error) {
            log.error(`❌ Failed to send Slack notification: ${(error as Error).message}`);
        }
    }

    private formatPayload(result: AnalysisResult): any {
        const isPriceDrop = this.isPriceDecrease(result);
        const isOutOfStock = result.diffSummary.text.toLowerCase().includes('out of stock') || result.diffSummary.text.toLowerCase().includes('sold out');

        // Color logic
        let color = '#36a64f'; // Green (default/good)
        if (isOutOfStock) color = '#ff0000'; // Red
        else if (isPriceDrop) color = '#36a64f'; // Green
        else if (result.severityScore > 50) color = '#e8a800'; // Yellow/Warning

        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🔔 Change Detected: ${this.getDomain(result.url)}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Severity:*\n${result.severityScore}/100`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Type:*\n${result.changeType}`,
                    },
                ],
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Summary:*\n${result.aiAnalysis?.summary || result.diffSummary.text.substring(0, 500)}`,
                },
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'View Page',
                            emoji: true,
                        },
                        url: result.url,
                        style: 'primary'
                    },
                ],
            },
        ];

        return {
            attachments: [
                {
                    color: color,
                    blocks: blocks,
                },
            ],
        };
    }

    private getDomain(url: string): string {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    private isPriceDecrease(result: AnalysisResult): boolean {
        // Look for numeric changes in the structured diffs
        const priceDiffs = result.diffSummary.structured.filter(d =>
            this.isNumericChange(d.old, d.new) &&
            (d.old?.includes('$') || d.new?.includes('$') || d.selector.toLowerCase().includes('price'))
        );

        if (priceDiffs.length === 0) return false;

        // Check if the most significant price change is a decrease
        for (const diff of priceDiffs) {
            const oldNum = parseFloat(diff.old?.replace(/[^0-9.]/g, '') || '0');
            const newNum = parseFloat(diff.new?.replace(/[^0-9.]/g, '') || '0');

            if (newNum < oldNum) return true;
        }

        return false;
    }

    private isNumericChange(oldVal: string | null, newVal: string | null): boolean {
        if (!oldVal || !newVal) return false;
        const oldNum = oldVal.replace(/[^0-9.]/g, '');
        const newNum = newVal.replace(/[^0-9.]/g, '');
        return oldNum !== '' && newNum !== '' && oldNum !== newNum;
    }
}
