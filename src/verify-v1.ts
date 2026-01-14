import { Preprocessor } from './core/preprocessor.js';
import { DiffEngine } from './core/diff.js';
import { SemanticClassifier } from './core/classifier.js';
import { Scorer } from './core/scorer.js';
import { PRESETS } from './config.js';

async function verifyScenarioA() {
    console.log('🧪 Verifying Scenario A: Pricing Change...');

    const htmlBefore = '<div><h3>T-Shirt</h3><span class="price">$20.00</span></div>';
    const htmlAfter = '<div><h3>T-Shirt</h3><span class="price">$25.00</span></div>';

    const preset = PRESETS.pricing;

    // 1. Normalize
    const normalizedBefore = Preprocessor.normalize(htmlBefore);
    const normalizedAfter = Preprocessor.normalize(htmlAfter);

    console.log('✅ Normalization complete.');

    // 2. Diff
    const diffs = DiffEngine.compare(normalizedBefore, normalizedAfter);
    console.log(`✅ Diff generated: ${diffs.length} items.`);
    console.log(JSON.stringify(diffs, null, 2));

    // 3. Classify
    const changeType = SemanticClassifier.classify(diffs, preset);
    console.log(`✅ Classified as: ${changeType}`);

    // 4. Score
    const { score: severityScore, reasons } = Scorer.calculateSeverity(diffs, preset);
    console.log(`✅ Severity Score: ${severityScore}/100`);
    console.log('Reasons:', reasons);

    // Verification
    if (diffs.length > 0 && changeType === 'content_modified' && severityScore >= 50) {
        console.log('🎉 SCENARIO A PASSED!');
    } else {
        console.log('❌ SCENARIO A FAILED.');
    }
}

verifyScenarioA().catch(console.error);
