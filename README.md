# <img src="./docs/assets/logo.svg" width="60" height="60" align="center" /> SWIM: Competitor Pricing Change Monitor (V1.1)

**Don't just detect changes. Understand them.**

SWIM (Semantic Web Intelligent Monitor) is a production-grade Apify Actor designed for high-accuracy tracking of pricing, inventory, and SEO shifts. Unlike standard scrapers, SWIM uses a structural diff engine (LCS) to ignore noise and focus on revenue-impacting data.

---

## 💎 Key Features (V1.1)

-   **LCS Diff Engine**: Industry-leading stability that handles prepended list items and shifting layouts without false alerts.
-   **Native Slack Integration**: Rich, color-coded alerts with intelligent price-drop detection.
-   **Visual Proof**: Context-aware screenshots that highlight exactly what changed in glowing red.
-   **AI Intelligence**: (Optional) Human-readable summaries explaining the business impact of a change.
-   **Auto-Persistence**: Named Key-Value Stores preserve state safely across scheduled cron runs.

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
2.  **Set `targetUrl`** to the product or page you want to monitor.
3.  **Configure `slackWebhookUrl`** to receive instant alerts.
4.  **(Optional)** Enable `useVisualProof` for visual confirmation of changes.

### Minimal Input Example:
```json
{
    "targetUrl": "https://example.com/product/123",
    "preset": "competitor-pricing",
    "slackWebhookUrl": "https://hooks.slack.com/services/...",
    "useVisualProof": true,
    "proxyConfiguration": { "useApifyProxy": true }
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
  "classification": "price_drop",
  "summary": "AI Summary: Price dropped from $99 to $79.",
  "visualProofUrl": "https://api.apify.com/v2/key-value-stores/...",
  "diff": [
    { "type": "removed", "content": "$99.00", "selector": ".price" },
    { "type": "added", "content": "$79.00", "selector": ".price" }
  ]
}
```

---

## 🛡️ Security & Privacy
SWIM uses a **BYOK (Bring Your Own Key)** model for AI features. Your API secrets are handled securely via Apify's masked inputs and are never logged or stored by the core engine.

---
*Built for quality, precision, and scale.*
