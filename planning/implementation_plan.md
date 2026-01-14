# AI Semantic Web Change Monitor - Implementation Plan

## Goal Description
Build a production-ready Apify Actor for semantic web change monitoring.
**V1 (MVP):** Focuses on efficient, deterministic change detection using Cheerio, structured diffing, and rule-based classification, with optional AI enrichment for semantic interpretation.
**V2 (Extended):** Adds historical contest, alert deduplication, and domain-specific intelligence.

## User Review Required
> [!IMPORTANT]
> **AI Usage Strategy**: V1 uses AI *only* for interpreting diffs to keep costs low. The primary diffing is algorithmic. Confirm this matches the "diff-only" requirement effectively.

> [!NOTE]
> **Notifications**: The actor will output to the Apify Dataset. Actual alerting (Email/Slack) is typically handled by Apify Webhooks triggering another service or actor, or standard Apify integrations. This actor will prepare the *payload* for those alerts.

## Proposed Architecture

### Core Components (V1)
1.  **Input Handler**: Validates input schema, loads presets.
2.  **Fetcher**: `got-scraping` + `cheerio` for raw HTML retrieval and parsing.
3.  **Preprocessor**: Cleans noise (scripts, styles, ads) and extracts "semantic text" (headers, paragraphs, prices).
4.  **Snapshot Manager**: Uses Apify `Key-Value Store` to read previous state and save current state.
5.  **Diff Engine**: Compares semantic text structures. Detects additions, deletions, and modifications.
6.  **Semantic Classifier**:
    -   **Regex Rules**: Legal terms, pricing patterns, out-of-stock variations.
    -   **Structure Rules**: H1/H2 changes, CTA button text changes.
7.  **AI Interpreter (Optional)**:
    -   Abstracted `AIProvider` interface (e.g., `OpenAIProvider`, `AnthropicProvider`) to allow easy swapping.
    -   Sends *diff* + context to LLM for summary & reasoning.
    -   Includes basic throttling/retry logic for rate limits.
8.  **Scoring Engine**: Calculates a `severity_score` (0-100) based on change type, location, and AI feedback.
9.  **Output Manager**: Pushes results to Dataset. Formats generic JSON payloads suitable for any webhook.

### V2 Extensions
1.  **History Store**:
    -   Maintains a rolling window of snapshots (configurable depth, default 5).
    -   Auto-prunes old snapshots to save KV storage.
2.  **Deduplicator**:
    -   Checks: `Hash(Diff Structure + Severity + URL)`.
    -   Includes a configurable **Time Window** (e.g., "ignore similar alerts for 24h").
3.  **Intelligence Packs**: Specialized rule sets injected into the Classifier/AI prompt based on domain (e.g., specific E-commerce logic).

### File Structure
```
src/
├── main.ts                 # Entry point
├── config.ts               # Configuration & Presets
├── core/
│   ├── fetcher.ts          # HTTP Request handling
│   ├── preprocessor.ts     # HTML cleaning & Extraction
│   ├── diff.ts             # Diff logic
│   └── scorer.ts           # Severity scoring
├── storage/
│   ├── state.ts            # KV Store interactions
│   └── history.ts          # (V2) History management
├── intelligence/
│   ├── classifier.ts       # Rule-based classification
│   ├── ai.ts               # LLM integration
│   └── deduplicator.ts     # (V2) Alert deduplication
├── types.ts                # Interfaces
└── utils/
    └── helpers.ts
```

## Data Schemas

### Input Schema
```json
{
    "targetUrl": "https://example.com/pricing",
    "preset": "pricing_monitor", // or 'policy', 'generic'
    "useAi": true,
    "aiProvider": "openai", // optional
    "apiKey": "...", // optional, encrypted
    "cssSelector": "main, .content", // restrict monitoring to area
    "notificationWebhook": "https://hooks.zapier.com/..."
}
```

### Output Schema (Dataset Item)
```json
{
    "url": "https://example.com/pricing",
    "timestamp": "2023-10-27T10:00:00Z",
    "changeDetected": true,
    "severityScore": 85,
    "changeType": "price_increase",
    "diffSummary": {
        "text": "Price changed from $10 to $12",
        "structured": [
            {
                "path": "div.price[0]",
                "selector": "#pricing > div.card:nth-child(1) > span.amount",
                "old": "$10",
                "new": "$12",
                "type": "modified"
            }
        ]
    },
    "aiAnalysis": {
        "summary": "The monthly subscription price increased by 20%.",
        "reason": "Inflation adjustment likely."
    },
    "v2": {
        "isDuplicate": false,
        "historyDepth": 5
    }
}
```

## Verification Plan

### Automated Tests
-   **Unit Tests**: Test the `DiffEngine` with mock HTML pairs (Before/After) to verify correct diff detection.
    -   *Cases*: Numeric deltas (price), Header changes, Hidden content, Script-generated content.
-   **Integration Tests**: Run the full actor flow against a static mock server (controlled inputs) to verify JSON output structure.

### Manual Verification
-   Run the actor against a live changing page (e.g., a news site or a specially prepared test page).
-   Verify Output JSON in Apify Console (or local storage).
