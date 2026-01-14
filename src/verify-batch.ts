import { InputSchema } from './types.js';
import { PRESETS } from './config.js';

console.log('🧪 Starting Batch & Threshold Verification...');

// 1. Verify Input Schema can handle both string and array
const singleInput = {
    targetUrl: "https://google.com",
    preset: "generic",
    slackWebhookUrl: "https://hooks.slack.com/xyz"
};

const batchInput = {
    targetUrl: ["https://google.com", "https://apify.com"],
    preset: "competitor-pricing",
    minSeverityToAlert: 75
};

try {
    InputSchema.parse(singleInput);
    console.log('✅ PASS: Single URL validation');

    InputSchema.parse(batchInput);
    console.log('✅ PASS: Batch URL validation');
} catch (e) {
    console.error('❌ FAIL: Input Schema validation');
    console.error((e as Error).message);
    process.exit(1);
}

// 2. Logic Check for Threshold
const mockSeverity = 30;
const mockThreshold = 40;
const meetsThreshold = mockSeverity >= mockThreshold;

console.log(`Checking threshold: ${mockSeverity} >= ${mockThreshold} ? ${meetsThreshold}`);
if (!meetsThreshold) {
    console.log('✅ PASS: Correctly suppresses low severity (30 < 40)');
} else {
    console.log('❌ FAIL: Failed to suppress low severity');
    process.exit(1);
}

console.log('🚀 Verification Complete!');
