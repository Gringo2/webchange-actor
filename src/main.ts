import { Actor, log } from 'apify';
import { CheerioFetcher } from './core/fetcher.js';
import { SlackNotifier } from './notifications/slack.js';
import { VisualProofer } from './core/visual-proofer.js';
import { Preprocessor } from './core/preprocessor.js';
import { DiffEngine } from './core/diff.js';
import { SemanticClassifier } from './core/classifier.js';
import { Scorer } from './core/scorer.js';
import { SnapshotManager } from './storage/state.js';
import { AIInterpreter } from './intelligence/ai.js';
import { PRESETS, DEFAULT_INPUT } from './config.js';
import { InputSchema, AnalysisResult } from './types.js';
import { gotScraping } from 'got-scraping';
import { HistoryStore } from './storage/history.js';
import { Deduplicator } from './intelligence/deduplicator.js';

await Actor.init();

try {
    // 1. Load and Validate Input
    const rawInput = (await Actor.getInput() || {}) as Record<string, any>;
    const input = InputSchema.parse({ ...DEFAULT_INPUT, ...rawInput });
    const preset = PRESETS[input.preset];

    // Normalize targetUrl to array for batch processing
    const targetUrls = Array.isArray(input.targetUrl) ? input.targetUrl : [input.targetUrl];

    log.info(`🚀 Starting SWIM Batch run for ${targetUrls.length} URL(s) (Preset: ${input.preset})`);

    const fetcher = new CheerioFetcher();
    const stateManager = new SnapshotManager();
    const historyStore = new HistoryStore();
    const deduplicator = new Deduplicator();

    for (const url of targetUrls) {
        log.info(`🔍 Processing: ${url}`);

        try {
            // 2. Fetch and Preprocess
            const { html: rawHtml } = await fetcher.fetch(url, input.cssSelector, input.proxyConfiguration);
            const normalizedHtml = Preprocessor.normalize(rawHtml, {
                excludeSelectors: preset.rules.excludeSelectors,
            });

            // 3. Compare with Previous Snapshot
            const previousHtml = await stateManager.getPrevious(url);

            if (!previousHtml) {
                log.info(`📝 No previous snapshot for ${url}. Saving baseline.`);
                await stateManager.save(url, normalizedHtml);
                await Actor.pushData({ url, timestamp: new Date().toISOString(), changeDetected: false, message: 'Initial baseline created.' });
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

            // 6. Optional AI Interpretation (Only for non-duplicates and significant changes)
            let aiAnalysis;
            const meetsThreshold = severityScore >= input.minSeverityToAlert;

            if (!isDuplicate && meetsThreshold && input.useAi && input.aiOptions?.apiKey) {
                log.info(`🤖 Invoking AI for significant change on ${url} (Severity: ${severityScore})`);
                const ai = new AIInterpreter({
                    apiKey: input.aiOptions.apiKey,
                    model: input.aiOptions.model,
                });
                aiAnalysis = await ai.analyze(diffs, preset);
            }

            // V2 History Management
            await historyStore.push(url, normalizedHtml, input.historyDepth);
            const history = await historyStore.getHistory(url);

            // 7. Conditional Visual Proof (With Context Highlighting)
            let screenshotUrl: string | undefined;
            if (!isDuplicate && meetsThreshold && input.useVisualProof) {
                // Find priority selectors for highlighting
                const firstDiff = diffs[0];
                const snapshotSelector = input.cssSelector || firstDiff.selector;
                const contextSelector = firstDiff.contextPath;

                log.info(`📸 Capturing context-aware visual proof... (Context: ${firstDiff.context})`);
                screenshotUrl = await VisualProofer.capture(url, snapshotSelector, contextSelector) || undefined;
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
            };

            // 9. Save State and Push Result
            await stateManager.save(url, normalizedHtml);
            await Actor.pushData({
                ...result,
                '#debug': {
                    requestId: Actor.getEnv().actorRunId,
                    isDuplicate,
                    meetsThreshold,
                    preset: input.preset,
                },
            });

            // 10. Notifications (Filter by Noise Threshold)
            if (!isDuplicate && meetsThreshold) {
                log.info(`🔔 Severity ${severityScore} exceeds threshold ${input.minSeverityToAlert}. Sending alerts...`);

                // 10a. Slack
                if (input.slackWebhookUrl) {
                    const slack = new SlackNotifier(input.slackWebhookUrl);
                    await slack.send(result);
                }

                // 10b. Generic Webhook
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
            } else if (!meetsThreshold) {
                log.info(`🔇 Skipping alerts for ${url}: Severity ${severityScore} is below threshold ${input.minSeverityToAlert}`);
            }

        } catch (urlError) {
            log.error(`❌ Error processing ${url}: ${(urlError as Error).message}`);
        }
    }

    await Actor.exit();

} catch (error) {
    const err = error as Error;
    log.error(`💥 Fatal error: ${err.message}`);
    await Actor.fail(err.message);
}
