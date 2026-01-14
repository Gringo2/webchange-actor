# <img src="./docs/assets/logo.svg" width="60" height="60" align="center" /> SWIM: Competitor Pricing Change Monitor (V1.2 Elite)

**Don't just detect changes. Understand them.**

SWIM (Semantic Web Intelligent Monitor) is a production-grade Apify Actor designed for high-accuracy tracking of pricing, inventory, and SEO shifts. Unlike standard scrapers, SWIM uses a structural diff engine (LCS) to ignore noise and focus on revenue-impacting data.

---

## 💎 Key Features (V1.2 Elite)

-   **Batch Monitoring**: High-scale loop that monitors multiple competitor URLs in a single run.
-   **LCS Diff Engine**: Structural diff stability that handles list insertions and shifting layouts without false alerts.
-   **Noise Guard**: Severity-based filtering (`minSeverityToAlert`) to suppress insignificant 1-cent changes.
-   **Visual Proof**: Context-aware screenshots that highlight both the change (Red) and the product identifier (Blue).
-   **AI Intelligence**: (Optional) LLM-powered interpretation of changes with semantic product attribution.
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
2.  **Set `targetUrl`** to the product or page you want to monitor (supports List/Array).
3.  **Configure `slackWebhookUrl`** to receive instant alerts.
4.  **(Optional)** Enable `useVisualProof` for visual confirmation of changes.

### Minimal Batch Example:
```json
{
    "targetUrl": ["https://site1.com/p1", "https://site2.com/p2"],
    "preset": "competitor-pricing",
    "slackWebhookUrl": "https://hooks.slack.com/services/...",
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
