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

    log.info(`🚀 Starting SWIM for: ${input.targetUrl} (Preset: ${input.preset})`);

    // 2. Fetch and Preprocess
    const fetcher = new CheerioFetcher();
    const stateManager = new SnapshotManager();
    const historyStore = new HistoryStore();
    const deduplicator = new Deduplicator();

    const { html: rawHtml } = await fetcher.fetch(input.targetUrl, input.cssSelector, input.proxyConfiguration);
    const normalizedHtml = Preprocessor.normalize(rawHtml, {
        excludeSelectors: preset.rules.excludeSelectors,
    });

    // 3. Compare with Previous Snapshot
    const previousHtml = await stateManager.getPrevious(input.targetUrl);

    if (!previousHtml) {
        log.info('📝 No previous snapshot found. Saving current state as baseline.');
        await stateManager.save(input.targetUrl, normalizedHtml);

        await Actor.pushData({
            url: input.targetUrl,
            timestamp: new Date().toISOString(),
            changeDetected: false,
            message: 'Initial snapshot created. Monitoring will start from the next run.',
        });

        await Actor.exit();
    } else {
        // 4. Generate Diff
        const diffs = DiffEngine.compare(previousHtml, normalizedHtml, preset);


        // 5. Semantic Analysis
        const changeType = SemanticClassifier.classify(diffs, preset);
        const { score: severityScore, reasons } = Scorer.calculateSeverity(diffs, preset);

        // V2 Deduplication
        const eventHash = Deduplicator.generateEventHash(input.targetUrl, diffs, severityScore);
        const isDuplicate = await deduplicator.isDuplicate(eventHash, input.cooldownPeriodMinutes / 60);

        if (!isDuplicate && diffs.length > 0) {
            await deduplicator.recordEvent(eventHash);
        }

        // 6. Optional AI Interpretation
        let aiAnalysis;
        if (!isDuplicate && input.useAi && input.aiOptions?.apiKey && diffs.length > 0) {
            log.info('🤖 Invoking AI Interpreter...');
            const aiOptions = input.aiOptions!;
            const ai = new AIInterpreter({
                apiKey: aiOptions.apiKey!,
                model: aiOptions.model,
            });
            aiAnalysis = await ai.analyze(diffs, preset);
        }

        // V2 History Management
        if (diffs.length > 0) {
            await historyStore.push(input.targetUrl, normalizedHtml, input.historyDepth);
        }
        const history = await historyStore.getHistory(input.targetUrl);

        // 6b. Conditional Visual Proof
        let visualProofUrl: string | undefined;
        if (!isDuplicate && diffs.length > 0 && input.useVisualProof) {
            // Priority: 1. User specified selector, 2. First matching preset include selector, 3. Undefined (Full page)
            let snapshotSelector = input.cssSelector;
            if (!snapshotSelector && preset.rules.includeSelectors.length > 0) {
                // Heuristic: Use the first selector from the preset that actually appeared in the diffs
                const firstMatchingDiff = diffs.find(d =>
                    preset.rules.includeSelectors.some(s => d.selector.includes(s))
                );
                snapshotSelector = firstMatchingDiff?.selector || preset.rules.includeSelectors[0];
            }

            visualProofUrl = await VisualProofer.capture(input.targetUrl, snapshotSelector) || undefined;
        }

        // 7. Format Output
        const result: AnalysisResult = {
            url: input.targetUrl,
            timestamp: new Date().toISOString(),
            changeDetected: diffs.length > 0,
            severityScore,
            changeType,
            diffSummary: {
                text: Preprocessor.extractText(normalizedHtml),
                structured: diffs,
            },
            aiAnalysis,
            visualProofUrl,
            v2: {
                isDuplicate,
                deduplicationHash: eventHash,
                historyDepth: input.historyDepth,
                relatedSnapshots: history.map(h => h.timestamp),
                reasons,
            },
        };

        // 8. Save State and Push Result
        if (result.changeDetected) {
            log.info(`🔔 Change detected! Severity: ${severityScore}/100`);
            await stateManager.save(input.targetUrl, normalizedHtml);
        }

        await Actor.pushData({
            ...result,
            '#debug': {
                requestId: Actor.getEnv().actorRunId,
                preset: input.preset,
                useAi: input.useAi,
                useVisualProof: input.useVisualProof,
            },
        });

        // 9. Notifications
        if (!isDuplicate && result.changeDetected && severityScore >= 50) {
            // 9a. Slack Notification (Rich)
            if (input.slackWebhookUrl) {
                log.info(`💬 Sending rich Slack notification to: ${input.slackWebhookUrl}`);
                const slack = new SlackNotifier(input.slackWebhookUrl);
                await slack.send(result);
            }

            // 9b. Generic Webhook Notification
            if (input.notificationConfig?.webhookUrl) {
                log.info(`📧 Sending webhook notification to: ${input.notificationConfig.webhookUrl}`);

                const maxRetries = 3;
                let attempt = 0;
                let success = false;

                while (attempt < maxRetries && !success) {
                    try {
                        await gotScraping.post(input.notificationConfig.webhookUrl, {
                            json: result,
                            headers: input.notificationConfig.authHeader ? {
                                'Authorization': input.notificationConfig.authHeader
                            } : {},
                            timeout: { request: 10000 },
                        });
                        log.info('✅ Webhook delivered successfully.');
                        success = true;
                    } catch (webhookError) {
                        attempt++;
                        const err = webhookError as Error;

                        if (attempt < maxRetries) {
                            const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                            log.warning(`❌ Webhook delivery failed (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${backoffMs / 1000}s...`);
                            await new Promise(resolve => setTimeout(resolve, backoffMs));
                        } else {
                            log.error(`❌ Webhook delivery failed after ${maxRetries} attempts: ${err.message}`);
                        }
                    }
                }
            }
        }

        await Actor.exit();
    }
} catch (error) {
    const err = error as Error;
    log.error(`💥 Actor failed with error: ${err.message}`);

    await Actor.pushData({
        error: true,
        message: err.message,
        timestamp: new Date().toISOString(),
    });

    await Actor.fail(err.message);
}

