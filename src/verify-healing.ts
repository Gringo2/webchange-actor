import { SlackNotifier } from './notifications/slack.js';
import { AnalysisResult } from './types.js';

console.log('🧪 Starting Sovereign Healing Verification...');

async function testHealingNotification() {
    console.log('1. Verifying Self-Heal Notification Payload...');

    const result: AnalysisResult = {
        url: 'https://healed-site.com',
        timestamp: new Date().toISOString(),
        changeType: 'content_modified',
        severityScore: 85,
        diffSummary: {
            text: 'Price changed from $100 to $95',
            structured: []
        },
        aiAnalysis: {
            summary: 'Significant price drop detected after selector recovery.',
            reasoning: 'Site changed structure but healing found the new price path.',
            recommendation: 'Monitor for further drops.'
        },
        autoHealedSelector: '.new-price-container span.price' // THIS TRIGGER THE SOVEREIGN THEME
    };

    // Mock Slack Notify
    const slack = new SlackNotifier('https://mock-webhook');
    const payload = (slack as any).formatPayload(result);

    console.log('Payload Color:', payload.attachments[0].color);
    console.log('Header Text:', payload.attachments[0].blocks[0].text.text);

    if (payload.attachments[0].color === '#7952b3' && payload.attachments[0].blocks[0].text.text.includes('Sovereign')) {
        console.log('✅ PASS: Sovereign Purple theme and Healing header are correct.');
    } else {
        console.log('❌ FAIL: Sovereign theme mismatch.');
        process.exit(1);
    }
}

testHealingNotification();
console.log('\n🚀 Sovereign Edition: Semantic Healing Verified!');
