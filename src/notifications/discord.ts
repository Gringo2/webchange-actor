import { gotScraping } from 'got-scraping';
import { AnalysisResult, RunStats } from '../types.js';
import { log } from 'apify';

export class DiscordNotifier {
    private webhookUrl: string;

    constructor(webhookUrl: string) {
        this.webhookUrl = webhookUrl;
    }

    async send(result: AnalysisResult): Promise<void> {
        try {
            const payload = this.formatPayload(result);
            await gotScraping.post(this.webhookUrl, {
                json: payload,
            });
            log.info('✅ Discord notification sent successfully.');
        } catch (error) {
            log.error(`❌ Failed to send Discord notification: ${(error as Error).message}`);
        }
    }

    private formatPayload(result: AnalysisResult): any {
        const isOutOfStock = result.diffSummary.text.toLowerCase().includes('out of stock');
        const isPriceDrop = result.changePercent ? result.changePercent < 0 : false;

        let color = 3066993; // Green (Decimal for #2ecc71)
        if (result.autoHealedSelector) color = 7950259; // Sovereign Purple (Decimal for #7952b3)
        else if (isOutOfStock) color = 15158332; // Red (Decimal for #e74c3c)
        else if (isPriceDrop) color = 3066993; // Green
        else if (result.severityScore > 50) color = 15844367; // Yellow (Decimal for #f1c40f)

        const fields = [
            { name: 'Severity', value: `${result.severityScore}/100`, inline: true },
            { name: 'Type', value: result.changeType, inline: true }
        ];

        if (result.changePercent) {
            fields.push({ name: 'Change %', value: `${result.changePercent.toFixed(2)}%`, inline: true });
        }

        let description = `**Summary:**\n${result.aiAnalysis?.summary || 'No summary available.'}`;

        if (result.autoHealedSelector) {
            description = `✨ **Unbreakable Mode:** Website structure change detected. SWIM has automatically healed the tracker.\n**New Selector:** \`${result.autoHealedSelector}\`\n\n` + description;
        }

        const embed: any = {
            title: result.autoHealedSelector
                ? `✨ Sovereign Self-Heal: ${this.getDomain(result.url)}`
                : `🔔 Change Detected: ${this.getDomain(result.url)}`,
            url: result.url,
            color: color,
            description: description,
            fields: fields,
            timestamp: new Date().toISOString(),
            footer: { text: 'SWIM Sovereign Edition' }
        };

        if (result.aiAnalysis?.recommendation) {
            embed.description += `\n\n**🎯 Strategy:**\n${result.aiAnalysis.recommendation}`;
        }

        if (result.screenshotUrl) {
            embed.image = { url: result.screenshotUrl };
        }

        return {
            embeds: [embed]
        };
    }

    private getDomain(url: string): string {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    async sendBaseline(url: string): Promise<void> {
        const payload = {
            embeds: [{
                title: '🚀 New Tracker Established',
                color: 3447003, // Blue
                description: `SWIM has successfully created a baseline for:\n**${url}**\nMonitoring will continue based on your schedule.`
            }]
        };
        await this.dispatch(payload);
    }

    async sendError(url: string, error: string): Promise<void> {
        const payload = {
            embeds: [{
                title: '⚠️ Watchdog: Site Load Failure',
                color: 15158332, // Red
                description: `**Target URL:** ${url}\n**Error:** \`${error}\`\nSWIM will retry on the next scheduled run.`
            }]
        };
        await this.dispatch(payload);
    }

    async sendBatchSummary(stats: RunStats): Promise<void> {
        const durationSec = stats.durationMs ? Math.round(stats.durationMs / 1000) : 0;
        const efficiency = stats.durationMs && stats.total > 0 ? (stats.durationMs / 1000 / stats.total).toFixed(1) : 'N/A';

        const description = stats.dashboardUrl
            ? `📊 **Batch Statistics**\n• Targets: ${stats.total}\n• Changes: ${stats.changed}\n• Healed: ${stats.healed || 0}\n\n🚀 **[Open Sovereign Hub Dashboard](${stats.dashboardUrl})**`
            : '📊 **Batch Statistics**';

        const payload = {
            embeds: [{
                title: '🏁 Batch Execution Summary',
                color: 3447003, // Blue
                description: description,
                fields: [
                    { name: 'Targets', value: stats.total.toString(), inline: true },
                    { name: 'Changes', value: stats.changed.toString(), inline: true },
                    { name: 'Filtered', value: stats.filtered.toString(), inline: true },
                    { name: 'Failures', value: stats.failed.toString(), inline: true },
                    { name: 'Healed', value: (stats.healed || 0).toString(), inline: true },
                    { name: 'Duration', value: `${durationSec}s`, inline: true }
                ]
            }]
        };
        await this.dispatch(payload);
    }

    private async dispatch(payload: any): Promise<void> {
        try {
            await gotScraping.post(this.webhookUrl, { json: payload });
        } catch (error) {
            log.error(`Failed to send Discord notification: ${(error as Error).message}`);
        }
    }
}
