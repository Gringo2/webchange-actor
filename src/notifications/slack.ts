import { gotScraping } from 'got-scraping';
import { AnalysisResult, RunStats } from '../types.js';
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
        if (result.autoHealedSelector) color = '#7952b3'; // Sovereign Purple (Self-Correction)
        else if (isOutOfStock) color = '#ff0000'; // Red
        else if (isPriceDrop) color = '#36a64f'; // Green
        else if (result.severityScore > 50) color = '#e8a800'; // Yellow/Warning

        const blocks: any[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: result.autoHealedSelector
                        ? `✨ Sovereign Self-Heal: ${this.getDomain(result.url)}`
                        : `🔔 Change Detected: ${this.getDomain(result.url)}`,
                    emoji: true,
                },
            }
        ];

        // Self-Heal Banner
        if (result.autoHealedSelector) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `> 🩹 *Unbreakable Logic Triggered:* The site changed its structure. SWIM has automatically discovered the new selector: \`${result.autoHealedSelector}\`. Monitoring continues uninterrupted.`
                }
            });
        }

        blocks.push({
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
        });

        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Summary:*\n${result.aiAnalysis?.summary || this.formatFallbackSummary(result)}`,
            },
        });

        // Actionable Recommendation (Strategic Insight)
        if (result.aiAnalysis?.recommendation) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*🎯 Strategic Recommendation:*\n${result.aiAnalysis.recommendation}`,
                },
            });
        }

        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Raw Changes (Technical):*\n${this.formatRawChanges(result)}`,
            },
        });

        // Add Visual Proof if available
        if (result.screenshotUrl) {
            blocks.push({
                type: 'image',
                title: {
                    type: 'plain_text',
                    text: 'Visual Proof (Red: Delta, Blue: Context)',
                },
                image_url: result.screenshotUrl,
                alt_text: 'Visual Proof',
            });
        }

        blocks.push({
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
        });

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

    private formatRawChanges(result: AnalysisResult): string {
        const technicalDiffs = result.diffSummary.structured.slice(0, 5);
        if (technicalDiffs.length === 0) return '_No structured diff available_';

        const lines = technicalDiffs.map(d => {
            const label = d.type.toUpperCase();
            const selectorStr = `\`${d.selector}\``;
            if (d.type === 'modified') {
                return `• *${label}*: ${selectorStr} (\`${d.old}\` → \`${d.new}\`)`;
            }
            return `• *${label}*: ${selectorStr} (\`${d.new || d.old}\`)`;
        });

        if (result.diffSummary.structured.length > 5) {
            lines.push(`_...and ${result.diffSummary.structured.length - 5} more changes (see Dataset for full list)_`);
        }

        return lines.join('\n');
    }

    private formatFallbackSummary(result: AnalysisResult): string {
        const significantChanges = result.diffSummary.structured
            .filter(d => d.type !== 'added' || !['h1', 'h2', 'h3'].includes(d.selector)) // Ignore added headers if they are just context
            .slice(0, 3);

        if (significantChanges.length === 0) return result.diffSummary.text.substring(0, 500);

        return significantChanges.map(d => {
            const contextPrefix = d.context ? `*[${d.context}]* ` : '';
            if (d.type === 'modified') return `${contextPrefix}${d.selector} changed from ${d.old} to ${d.new}`;
            if (d.type === 'added') return `${contextPrefix}New content added to ${d.selector}: ${d.new}`;
            return `${contextPrefix}${d.selector} removed: ${d.old}`;
        }).join('\n');
    }

    private isPriceDecrease(result: AnalysisResult): boolean {
        const priceDiffs = result.diffSummary.structured.filter(d =>
            this.isNumericChange(d.old, d.new) &&
            (d.old?.includes('$') || d.new?.includes('$') || d.selector.toLowerCase().includes('price'))
        );

        if (priceDiffs.length === 0) return false;

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

    async sendBaseline(url: string): Promise<void> {
        const payload = {
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '🚀 New Tracker Established', emoji: true }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `SWIM has successfully created a baseline for:\n*${url}*\nMonitoring will continue based on your schedule.`
                    }
                }
            ]
        };
        await this.dispatch(payload);
    }

    async sendError(url: string, error: string): Promise<void> {
        const payload = {
            attachments: [
                {
                    color: '#ff0000',
                    blocks: [
                        {
                            type: 'header',
                            text: { type: 'plain_text', text: '⚠️ Watchdog: Site Load Failure', emoji: true }
                        },
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `*Target URL:* ${url}\n*Error:* \`${error}\`\nSWIM will retry on the next scheduled run.`
                            }
                        }
                    ]
                }
            ]
        };
        await this.dispatch(payload);
    }

    async sendBatchSummary(stats: RunStats): Promise<void> {
        const durationSec = stats.durationMs ? Math.round(stats.durationMs / 1000) : 0;
        const efficiency = stats.durationMs && stats.total > 0 ? (stats.durationMs / 1000 / stats.total).toFixed(1) : 'N/A';

        const payload: any = {
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '🏁 Batch Execution Summary', emoji: true }
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Targets:* ${stats.total}` },
                        { type: 'mrkdwn', text: `*Changes:* ${stats.changed}` },
                        { type: 'mrkdwn', text: `*Filtered:* ${stats.filtered}` },
                        { type: 'mrkdwn', text: `*Failures:* ${stats.failed !== 0 ? `*${stats.failed}*` : '0'}` },
                        { type: 'mrkdwn', text: `*Healed:* ${stats.healed || 0}` },
                        { type: 'mrkdwn', text: `*Duration:* ${durationSec}s` }
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        { type: 'mrkdwn', text: `🏃 Performance: ${efficiency}s per URL using optimized sequential loop.` }
                    ]
                }
            ]
        };

        if (stats.dashboardUrl) {
            payload.blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `🚀 *<${stats.dashboardUrl}|Open Sovereign Hub Dashboard>*`
                }
            });
        }

        await this.dispatch(payload);
    }

    private async dispatch(payload: any): Promise<void> {
        try {
            await gotScraping.post(this.webhookUrl, {
                json: payload,
                timeout: { request: 10000 },
            });
        } catch (error) {
            log.error(`Failed to send Slack notification: ${(error as Error).message}`);
        }
    }
}
