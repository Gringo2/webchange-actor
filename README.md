<div align="center">
  <img src="./assets/swim-logo.png" width="120" height="120" alt="Universal E-Commerce Scraper Logo" />
  <h1>Universal E-Commerce Scraper (AI-Powered)</h1>
</div>

**Monitor any product. On any site. Without breaking.**

This is an **AI-powered Universal Scraper** designed for high-accuracy tracking of pricing, inventory, and strategic shifts on *any* e-commerce platform (Amazon, Shopify, Walmart, WooCommerce, etc.).

Unlike traditional scrapers that break when layouts change, this Actor is **Sovereign**: it uses AI to autonomously "heal" itself, bypassing anti-bot protections and adapting to structural updates in real-time.

---

## 💎 Sovereign Features (V1.2)

-   **Semantic Healing**: Automatically recovers broken CSS selectors using AI, ensuring uninterrupted monitoring when sites change their design.
-   **Stealth Mode**: Advanced anti-blocking with randomized fingerprints, HTTP2, and session mimicking to bypass sophisticated scraping guards.
-   **Pattern Spotter**: AI-powered trend analysis that identifies recurring business cycles (e.g., weekend sales) across multiple runs.
-   **Batch Monitoring**: High-scale loop that monitors multiple competitor URLs in a single run with performance telemetry.
-   **Visual Proof**: Context-aware screenshots with dual-color highlighting (Red: Changes, Blue: Context).
-   **Multi-Channel Strategy**: Native rich notifications for both Slack and Discord webhooks.
-   **Storage Hygiene**: Automated state grooming to prune old snapshots and minimize storage overhead.

---

## 📚 Documentation Hub

For deep technical details, operational strategies, and setup guides, visit the **[SWIM Documentation Hub](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/index.html)**.

### Sub-Modules:
1.  **[Getting Started](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/setup.html)**: 3-minute setup and full input reference.
2.  **[Architecture](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/architecture.html)**: Technical map and LCS engine details.
3.  **[System Design](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/system-design.html)**: Scoring logic and persistence strategy.
4.  **[Use Cases](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/use-cases.html)**: Business scenarios and alert lifecycles.
5.  **[Operations](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/operations.html)**: Multi-competitor monitoring at scale.
6.  **[Troubleshooting](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/troubleshooting.html)**: FAQ and anti-scraping solutions.
7.  **[Developer Guide](file:///c:/Users/jobsb/Desktop/webchange-actor/docs/developer.html)**: Local dev and extension points.

---

## 🚀 Quick Start

1.  **Create an Apify Task** based on the SWIM Actor.
2.  **Set `targetUrl`** to the product or page you want to monitor (supports List/Array).
3.  **Configure `slackWebhookUrl`** to receive instant alerts.
4.  **(Optional)** Enable `useVisualProof` for visual confirmation of changes.

### Minimal Batch Example:
```json
{
    "targetUrl": ["https://site1.com/p1", "https://site2.com/p2"],
    "preset": "competitor-pricing",
    "slackWebhookUrl": "https://hooks.slack.com/services/YOUR_WEBHOOK_URL",
    "minSeverityToAlert": 50,
    "useVisualProof": true
}
```

---

## 📦 Output Contract

SWIM pushes a structured JSON analysis to the Apify Dataset:
```json
{
  "url": "https://example.com/product",
  "changeDetected": true,
  "severityScore": 85,
  "summary": "AI Summary: Price for iPhone 15 dropped from $999 to $949.",
  "screenshotUrl": "https://api.apify.com/v2/key-value-stores/...",
  "diffSummary": {
      "text": "...",
      "structured": [
        { "type": "modified", "old": "$999", "new": "$949", "selector": ".price", "context": "iPhone 15" }
      ]
  }
}
```

---

## 🛡️ Security & Privacy
SWIM uses a **BYOK (Bring Your Own Key)** model for AI features. Your API secrets are handled securely via Apify's masked inputs and are never logged or stored by the core engine.

---
*Built for quality, precision, and scale.*
