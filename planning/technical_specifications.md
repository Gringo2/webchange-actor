# Technical Specifications

## 1. JSON Data Schemas (Zod Definitions)

These schemas define the strict contract for Inputs and Outputs.

### 1.1 Actor Input Schema (V1 & V2)

```typescript
import { z } from 'zod';

export const InputSchema = z.object({
    targetUrl: z.string().url(),
    preset: z.enum(['pricing', 'policy', 'competitor', 'generic']).default('generic'),
    cssSelector: z.string().optional().describe("CSS selector to restrict monitoring"),
    useAi: z.boolean().default(false),
    aiOptions: z.object({
        provider: z.enum(['openai', 'anthropic']).default('openai'),
        model: z.string().optional(),
        apiKey: z.string().optional(), // Should be encrypted in Apify
    }).optional(),
    notificationConfig: z.object({
        webhookUrl: z.string().url(),
        authHeader: z.string().optional(),
    }).optional(),
});
```

### 1.2 Output Payload Schema (V1)

```typescript
export const OutputSchemaV1 = z.object({
    url: z.string().url(),
    timestamp: z.string().datetime(),
    changeDetected: z.boolean(),
    severityScore: z.number().min(0).max(100),
    changeType: z.enum(['content_added', 'content_removed', 'content_modified', 'structure_change', 'no_change']),
    diffSummary: z.object({
        text: z.string(),
        structured: z.array(z.object({
            path: z.string(), // e.g., "div.price[0]"
            selector: z.string(), // e.g., "#main > div.price"
            old: z.string().nullable(),
            new: z.string().nullable(),
            type: z.enum(['added', 'removed', 'modified'])
        }))
    }),
    aiAnalysis: z.object({
        summary: z.string(),
        reasoning: z.string(),
    }).optional(),
});
```

### 1.3 Output Payload Schema (V2 Extensions)

```typescript
export const OutputSchemaV2 = OutputSchemaV1.extend({
    v2: z.object({
        isDuplicate: z.boolean(),
        deduplicationHash: z.string(),
        historyDepth: z.number(),
        relatedSnapshots: z.array(z.string().datetime()), // Timestamps of previous changes
        reasons: z.array(z.string()), // Explanation of severity/change
    })
});
```

## 2. Mock HTML Test Scenarios

To verify the Diff Engine and Logic without live fetching, we will use the following mock pairs (Before/After).

### Scenario A: Pricing Change (Numeric)
**Goal**: Verify numeric delta detection and severity boosting.
- **Before**: `<div><h3>T-Shirt</h3><span class="price">$20.00</span></div>`
- **After**: `<div><h3>T-Shirt</h3><span class="price">$25.00</span></div>`
- **Expected**: Change detected, Severity > 50 (Price increase), Type `modified`.

### Scenario B: Structure Change (Noise vs Signal)
**Goal**: Verify noise removal (new ads) vs structural signal (new paragraph).
- **Before**: `<article><p>Intro</p></article>`
- **After**: `<article><div class="ad">Buy now!</div><p>Intro</p><p>New Details</p></article>`
- **Expected**: "New Details" detected as added content. "Buy now!" ignored if class="ad" is in noise exclusion list.

### Scenario C: Policy Update (Legal Text)
**Goal**: Verify keyword boosting (e.g., "terms", "liability").
- **Before**: `<p>Liability is limited to $50.</p>`
- **After**: `<p>Liability is limited to $0.</p>`
- **Expected**: Critical Severity (Legal change).

### Scenario D: Anti-Bot/Empty (Edge Case)
**Goal**: Verify error handling.
- **Before**: `<html>...content...</html>`
- **After**: `<html><body>Please enable JS</body></html>`
- **Expected**: `changeDetected: false` (or specific error flag), no hallucinated diff.

## 3. Preset Logic Definitions

Presets define the default configuration to be merged with User Input.

### 3.1 Preset Structure
```typescript
interface PresetConfig {
    id: string;
    description: string;
    rules: {
        includeSelectors: string[]; // CSS selectors to focus on
        excludeSelectors: string[]; // Noise to remove (ads, nav, footer)
        keywords: string[]; // Words that boost severity
    };
    aiPrompt?: string; // Specialized context for AI
}
```

### 3.2 Defined Presets
1.  **pricing_monitor**
    -   *Selectors*: `.price`, `.amount`, `[itemprop='price']`, `.offer`
    -   *Keywords*: "price", "cost", "save", "discount", "subscription"
    -   *AI Context*: "Focus on price changes, currency adjustments, or discount removal."

2.  **policy_monitor**
    -   *Selectors*: `main`, `article`, `.content`, `.legal`, `.terms`
    -   *Excludes*: `nav`, `footer`, `.cookie-banner`
    -   *Keywords*: "liability", "terms", "agree", "rights", "privacy", "effective date"
    -   *Analysis*: High severity for any text addition/deletion in legal paragraphs.

3.  **competitor_monitor**
    -   *Selectors*: `h1`, `h2`, `.product-title`, `.features`, `.pricing`
    -   *Keywords*: "new feature", "launch", "beta", "sold out"
    -   *Goal*: Broad monitoring of product pages for substantial updates.

4.  **generic_monitor** (Default)
    -   *Selectors*: `body` (with smart noise reduction)
    -   *Excludes*: `script`, `style`, `noscript`, `svg`, `header`, `footer`, `.nav`, `.menu`
    -   *Goal*: Catch-all for undefined use cases.

