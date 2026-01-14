import { Actor, log } from 'apify';
import { CheerioFetcher } from './core/fetcher.js';
import { SlackNotifier } from './notifications/slack.js';
import { DiscordNotifier } from './notifications/discord.js';
import { VisualProofer } from './core/visual-proofer.js';
import { Preprocessor } from './core/preprocessor.js';
import { DiffEngine } from './core/diff.js';
import { SemanticClassifier } from './core/classifier.js';
import { Scorer } from './core/scorer.js';
import { SnapshotManager } from './storage/state.js';
import { AIInterpreter } from './intelligence/ai.js';
import { PRESETS, DEFAULT_INPUT } from './config.js';
import { InputSchema, AnalysisResult, RunStats } from './types.js';
import { gotScraping } from 'got-scraping';
import { HistoryStore } from './storage/history.js';
import { Deduplicator } from './intelligence/deduplicator.js';
import { DashboardGenerator } from './core/dashboard.js';

await Actor.init();

const startTime = Date.now();

try {
    // 1. Load and Validate Input
    const rawInput = (await Actor.getInput() || {}) as Record<string, any>;
    const input = InputSchema.parse({ ...DEFAULT_INPUT, ...rawInput });
    const preset = PRESETS[input.preset];

    // Normalize targetUrl to array for batch processing
    const targetUrls = Array.isArray(input.targetUrl) ? input.targetUrl : [input.targetUrl];

    log.info(`🚀 Starting SWIM Sovereign Batch run for ${targetUrls.length} URL(s)`);

    const fetcher = new CheerioFetcher();
    const stateManager = new SnapshotManager();
    const historyStore = new HistoryStore();
    const deduplicator = new Deduplicator();

    // Multi-Channel Notifiers
    const slack = input.slackWebhookUrl ? new SlackNotifier(input.slackWebhookUrl) : null;
    const discord = input.discordWebhookUrl ? new DiscordNotifier(input.discordWebhookUrl) : null;

    const stats: RunStats = {
        total: targetUrls.length,
        changed: 0,
        filtered: 0,
        failed: 0,
        healed: 0
    };

    // Results accumulator for the Dashboard
    const batchResults: AnalysisResult[] = [];

    // Global selector that can be "Healed" during the run
    let activeSelector = input.cssSelector;

    for (const url of targetUrls) {
        log.info(`🔍 Processing: ${url}`);

        try {
            // 2. Fetch Content (with Semantic Healing check)
            let { html: rawHtml } = await fetcher.fetch(url, activeSelector, input.proxyConfiguration);

            // Sovereign: Semantic Healing Logic
            let autoHealedSelector: string | undefined;
            if (activeSelector && rawHtml.trim() === '' && input.enableHealing && input.useAi && input.aiOptions?.apiKey) {
                log.warning(`🧯 Selector '${activeSelector}' failed. Attempting Sovereign Healing...`);

                // Fetch whole page to scan for the replacement
                const { html: fullHtml } = await fetcher.fetch(url, undefined, input.proxyConfiguration);
                const ai = new AIInterpreter({
                    apiKey: input.aiOptions.apiKey,
                    model: input.aiOptions.model,
                });

                // Use preset ID or existing results as context
                const semanticContext = preset.id.replace(/-/g, ' ');
                const healed = await ai.healSelector(activeSelector, semanticContext, fullHtml);

                if (healed) {
                    log.info(`✨ Healing SUCCESS: New selector found -> '${healed}'`);
                    activeSelector = healed;
                    autoHealedSelector = healed;
                    stats.healed = (stats.healed || 0) + 1;

                    // Re-fetch with healed selector
                    const reFetch = await fetcher.fetch(url, activeSelector, input.proxyConfiguration);
                    rawHtml = reFetch.html;
                } else {
                    log.error(`❌ Healing failed. The site might have changed beyond recognition.`);
                }
            }

            const normalizedHtml = Preprocessor.normalize(rawHtml, {
                excludeSelectors: preset.rules.excludeSelectors,
            });

            // 3. Compare with Previous Snapshot
            const previousHtml = await stateManager.getPrevious(url);

            if (!previousHtml) {
                log.info(`📝 No previous snapshot for ${url}. Saving baseline.`);
                await stateManager.save(url, normalizedHtml);
                await Actor.pushData({ url, timestamp: new Date().toISOString(), changeDetected: false, message: 'Initial baseline created.' });

                if (slack) await slack.sendBaseline(url);
                if (discord) await discord.sendBaseline(url);
                continue;
            }

            // 4. Generate Diff
            const diffs = DiffEngine.compare(previousHtml, normalizedHtml, preset);

            if (diffs.length === 0) {
                log.info(`✅ No changes detected for: ${url}`);
                continue;
            }

            // 5. Semantic Analysis
            const changeType = SemanticClassifier.classify(diffs, preset);
            const { score: severityScore, reasons } = Scorer.calculateSeverity(diffs, preset);

            // V2 Deduplication
            const eventHash = Deduplicator.generateEventHash(url, diffs, severityScore);
            const isDuplicate = await deduplicator.isDuplicate(eventHash, input.cooldownPeriodMinutes / 60);

            if (!isDuplicate) {
                await deduplicator.recordEvent(eventHash);
            }

            // 6. God-Mode: Pattern-Aware AI Analysis
            let aiAnalysis;
            const meetsThreshold = severityScore >= input.minSeverityToAlert;

            if (!isDuplicate && meetsThreshold && input.useAi && input.aiOptions?.apiKey) {
                const ai = new AIInterpreter({
                    apiKey: input.aiOptions.apiKey,
                    model: input.aiOptions.model,
                });

                const historySummaries = await historyStore.getSummaries(url);
                aiAnalysis = await ai.analyze(diffs, preset, historySummaries);

                if (aiAnalysis.summary) {
                    await historyStore.pushSummary(url, aiAnalysis.summary, 10);
                }
            }

            // V2 History Management
            await historyStore.push(url, normalizedHtml, input.historyDepth);
            const history = await historyStore.getHistory(url);

            // 7. Conditional Visual Proof
            let screenshotUrl: string | undefined;
            if (!isDuplicate && meetsThreshold && input.useVisualProof) {
                const firstDiff = diffs[0];
                const snapshotSelector = activeSelector || firstDiff.selector;
                const contextSelector = firstDiff.contextPath;

                screenshotUrl = await VisualProofer.capture(url, snapshotSelector, contextSelector, input.waitForSelector) || undefined;
            }

            // Spreadsheet Optimization Logic
            const priceDiff = diffs.find(d => d.type === 'modified' && (d.old?.includes('$') || d.new?.includes('$') || d.selector.includes('price')));
            let oldPrice: number | undefined;
            let newPrice: number | undefined;
            let changePercent: number | undefined;

            if (priceDiff) {
                const parsePrice = (val: string | null) => {
                    if (!val) return undefined;
                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                    return isNaN(num) ? undefined : num;
                };
                oldPrice = parsePrice(priceDiff.old);
                newPrice = parsePrice(priceDiff.new);
                if (oldPrice && newPrice && oldPrice !== 0) {
                    changePercent = parseFloat(((newPrice - oldPrice) / oldPrice * 100).toFixed(2));
                }
            }

            // 8. Format Result
            const result: AnalysisResult = {
                url,
                timestamp: new Date().toISOString(),
                changeType,
                severityScore,
                diffSummary: {
                    text: Preprocessor.extractText(normalizedHtml),
                    structured: diffs,
                },
                aiAnalysis,
                screenshotUrl,
                autoHealedSelector,
                // Flattened Export Fields
                productName: diffs[0]?.context,
                oldPrice,
                newPrice,
                changePercent,
                v2: {
                    isDuplicate,
                    deduplicationHash: eventHash,
                    historyDepth: input.historyDepth,
                    relatedSnapshots: history.map(h => h.timestamp),
                    reasons,
                }
            };

            batchResults.push(result);

            // 9. Save State and Push Result
            await stateManager.save(url, normalizedHtml);
            await Actor.pushData({
                ...result,
                '#debug': {
                    requestId: Actor.getEnv().actorRunId,
                    isDuplicate,
                    meetsThreshold,
                    preset: input.preset,
                    runtimeSec: Math.round((Date.now() - startTime) / 1000),
                    healed: !!autoHealedSelector
                },
            });

            // Update Stats
            stats.changed++;
            if (!meetsThreshold) stats.filtered++;

            // 10. Multi-Channel Notifications
            if (!isDuplicate && meetsThreshold) {
                if (slack) await slack.send(result);
                if (discord) await discord.send(result);

                if (input.notificationConfig?.webhookUrl) {
                    try {
                        await gotScraping.post(input.notificationConfig.webhookUrl, {
                            json: result,
                            headers: input.notificationConfig.authHeader ? { 'Authorization': input.notificationConfig.authHeader } : {},
                        });
                    } catch (e) {
                        log.error(`❌ Webhook failed for ${url}: ${(e as Error).message}`);
                    }
                }
            }

        } catch (urlError) {
            stats.failed++;
            const err = urlError as Error;
            log.error(`❌ Error processing ${url}: ${err.message}`);

            if (slack) await slack.sendError(url, err.message);
            if (discord) await discord.sendError(url, err.message);
        }
    }

    // Finalize Stats
    stats.durationMs = Date.now() - startTime;

    // Victory Lap: Launchpad (Premium Dashboard)
    if (batchResults.length > 0 && input.generateDashboard) {
        stats.dashboardUrl = await DashboardGenerator.generate(batchResults, stats);
    }

    // 11. Final Batch Summaries
    if (targetUrls.length > 1 || stats.dashboardUrl) {
        if (slack) await slack.sendBatchSummary(stats);
        if (discord) await discord.sendBatchSummary(stats);
    }

    // 12. Storage Grooming
    const pruned = await stateManager.prune(input.storageGroomingDays);
    if (pruned > 0) log.info(`✨ Pruned ${pruned} old snapshot(s).`);

    await Actor.exit();

} catch (error) {
    const err = error as Error;
    log.error(`💥 Fatal error: ${err.message}`);
    await Actor.fail(err.message);
}
