import { Actor, log } from 'apify';
import { AnalysisResult, RunStats } from '../types.js';

export class DashboardGenerator {
    /**
     * sovereign: Victory Lap Launchpad
     * Generates a premium, dark-mode HTML report from the run results.
     */
    static async generate(results: AnalysisResult[], stats: RunStats): Promise<string> {
        log.info('📊 Generating SWIM Hub Dashboard (Launchpad)...');

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SWIM Hub: Sovereign Launchpad</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0a0c;
            --card-bg: #111114;
            --primary: #7952b3;
            --primary-glow: rgba(121, 82, 179, 0.3);
            --text-main: #e0e0e3;
            --text-muted: #8e8e93;
            --positive: #2ecc71;
            --negative: #e74c3c;
            --warning: #f1c40f;
            --border: #1f1f23;
        }

        * { margin:0; padding:0; box-sizing: border-box; }
        body { 
            font-family: 'Outfit', sans-serif; 
            background: var(--bg); 
            color: var(--text-main); 
            line-height: 1.6;
            padding: 40px;
        }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo-group { display: flex; align-items: center; gap: 15px; }
        .logo-text { font-size: 2em; font-weight: 700; letter-spacing: -1px; }
        .badge { background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7em; text-transform: uppercase; font-weight: 700; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: var(--card-bg); padding: 25px; border-radius: 16px; border: 1px solid var(--border); transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-label { font-size: 0.8em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; }
        .stat-value { font-size: 2.2em; font-weight: 700; color: var(--text-main); }
        .stat-value.healed { color: var(--primary); }

        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
        .section-title { font-size: 1.2em; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }

        .result-card { background: var(--card-bg); padding: 25px; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 20px; position: relative; overflow: hidden; }
        .result-card::before { content: ''; position: absolute; left: 0; top:0; bottom:0; width: 4px; background: var(--border); }
        .result-card.healed::before { background: var(--primary); }
        .result-card.critical::before { background: var(--negative); }

        .result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .url { font-weight: 600; color: var(--text-main); text-decoration: none; opacity: 0.9; }
        .url:hover { opacity: 1; color: var(--primary); }
        .time { font-size: 0.8em; color: var(--text-muted); }

        .ai-summary { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 3px solid var(--primary); }
        .reco { font-size: 0.9em; margin-top: 10px; color: var(--primary); font-weight: 500; }

        .diff-tag { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.75em; font-weight: 600; margin-right: 5px; background: rgba(255,255,255,0.05); }
        .diff-tag.mod { color: var(--warning); }
        .diff-tag.add { color: var(--positive); }
        .diff-tag.rem { color: var(--negative); }

        .visual-container { margin-top: 15px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
        .visual-container img { width: 100%; display: block; }

        .reco-sidebar { position: sticky; top: 40px; }
        .action-card { background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .action-icon { font-size: 1.5em; margin-bottom: 10px; }
        .action-text { font-size: 0.9em; font-weight: 500; color: var(--text-main); }

        .footer { margin-top: 60px; text-align: center; color: var(--text-muted); font-size: 0.8em; border-top: 1px solid var(--border); padding-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-group">
            <span class="logo-text">SWIM HUB</span>
            <span class="badge">Sovereign Launchpad</span>
        </div>
        <div class="time">Run Report: ${new Date().toLocaleString()}</div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Targets</div>
            <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Changes Detected</div>
            <div class="stat-value" style="color: var(--positive)">${stats.changed}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Sovereign Heals</div>
            <div class="stat-value healed">${stats.healed || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Efficiency</div>
            <div class="stat-value">${(stats.durationMs ? stats.durationMs / 1000 : 0).toFixed(1)}s</div>
        </div>
    </div>

    <div class="main-grid">
        <div class="results-area">
            <div class="section-title">🕵️ Monitoring Intelligence Feed</div>
            ${results.map(r => this.renderResultCard(r)).join('')}
        </div>

        <div class="reco-sidebar">
            <div class="section-title">🎯 Executive Actions</div>
            ${results.filter(r => r.aiAnalysis?.recommendation).map(r => `
                <div class="action-card">
                    <div class="action-icon">💡</div>
                    <div class="action-text">${r.aiAnalysis!.recommendation}</div>
                    <div style="font-size: 0.7em; color: var(--text-muted); margin-top: 5px;">Source: ${new URL(r.url).hostname}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="footer">
        &copy; 2026 SWIM Sovereign Edition - Built for Strategic Oversight
    </div>
</body>
</html>
        `;

        const kvs = await Actor.openKeyValueStore();
        const key = `DASHBOARD_${Date.now()}`;
        await kvs.setValue(key, html, { contentType: 'text/html' });

        const url = `https://api.apify.com/v2/key-value-stores/${kvs.id}/records/${key}`;
        log.info(`✅ Dashboard generated successfully: ${url}`);
        return url;
    }

    private static renderResultCard(result: AnalysisResult): string {
        const isHealed = !!result.autoHealedSelector;
        const isCritical = result.severityScore > 70;

        return `
            <div class="result-card ${isHealed ? 'healed' : ''} ${isCritical ? 'critical' : ''}">
                <div class="result-header">
                    <a href="${result.url}" target="_blank" class="url">${new URL(result.url).hostname.replace('www.', '')}</a>
                    <div class="time">${new Date(result.timestamp).toLocaleTimeString()}</div>
                </div>

                ${result.aiAnalysis ? `
                    <div class="ai-summary">
                        <strong>AI Summary:</strong> ${result.aiAnalysis.summary}
                        ${result.aiAnalysis.pattern ? `<div style="font-size: 0.85em; color: var(--text-muted); margin-top: 8px;">🔄 <strong>Pattern Detected:</strong> ${result.aiAnalysis.pattern}</div>` : ''}
                    </div>
                ` : ''}

                <div class="diff-meta">
                    <span class="diff-tag">Score: ${result.severityScore}</span>
                    <span class="diff-tag">${result.changeType}</span>
                    ${isHealed ? '<span class="diff-tag" style="background: var(--primary); color: white;">HEALED</span>' : ''}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; font-size: 0.9em; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                     ${result.productName ? `<div><strong>Product:</strong> ${result.productName.substring(0, 40)}...</div>` : ''}
                     ${result.newPrice ? `<div><strong>Current Price:</strong> <span style="color: var(--positive); font-weight: bold;">$${result.newPrice}</span> ${result.oldPrice ? `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.9em; margin-left: 5px;">$${result.oldPrice}</span>` : ''}</div>` : ''}
                     ${result.changePercent ? `<div><strong>Change:</strong> <span style="color: ${result.changePercent < 0 ? 'var(--positive)' : 'var(--negative)'}">${result.changePercent > 0 ? '+' : ''}${result.changePercent}%</span></div>` : ''} 
                </div>

                ${result.screenshotUrl ? `
                    <div class="visual-container">
                        <img src="${result.screenshotUrl}" alt="Visual Proof">
                    </div>
                ` : ''}
            </div>
        `;
    }
}
