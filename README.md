# <img src="./assets/swim-logo.svg" width="60" height="60" align="center" /> Competitor Pricing Change Monitor (AI-powered)

**We don’t tell you that a page changed. We tell you *what* changed and *why* it matters.**

This actor is a precision tool for monitoring pricing, inventory, and SEO changes. It uses semantic analysis to ignore ads, popups, and layout shifts, focusing only on the data that affects your revenue.

---

## 🌟 Why This Actor?

-   **Zero Noise**: Ignores ads, timestamps, and random HTML changes.
-   **Smart Defaults**: Pre-configured for pricing and inventory tracking right out of the box.
-   **No Alert Fatigue**: Deduplication ensures you never get bombarded for the same event twice.
-   **AI Explanation**: (Optional) Uses GPT-4 to tell you *why* a change matters (e.g., "Price increased by 20%", "Product is now Sold Out").

---

## 🚀 Use Cases

### 1. Competitor Pricing (Default)
Track your competitors' product pages. Get notified instantly when they:
-   Lower their price.
-   Run a new discount or sale.
-   Change their subscription tiers.

### 2. Inventory Tracking
Stop losing revenue to stockouts. Monitor key suppliers or competitors for:
-   "Sold Out" -> "In Stock" flips.
-   "Pre-order" availability.
-   Low stock warnings.

### 3. SEO Intelligence
Protect your rankings. Catch silent changes to:
-   Page Titles and Meta Descriptions.
-   H1 Headers.
-   Canonical tags.


---

## 🛠 Usage

### Input Configuration

The actor accepts a clean JSON input. The only required field is `targetUrl`.

```json
{
    "targetUrl": "https://example.com/product/123",
    "preset": "competitor-pricing",
    "useAi": true,
    "notificationConfig": {
        "webhookUrl": "https://hooks.zapier.com/..."
    }
}
```

### Available Presets

| Preset | Optimized For | Triggers On |
| :--- | :--- | :--- |
| **`competitor-pricing`** | **E-commerce / SaaS** | Price changes, discounts, currency updates. |
| `inventory-tracker` | **Supply Chain / Retail** | "Sold Out", "In Stock", "Backorder" status changes. |
| `seo-intelligence`  | **Growth / Marketing**    | Changes to Title tags, Meta descriptions, or H1s.   |
| `generic` | **Power Users** | Custom selectors for any other use case. |

---

## 📦 Output Example

You get a clean JSON result pushed to the default Apify Dataset.

```json
{
    "url": "https://example.com/pricing",
    "timestamp": "2023-10-27T10:00:00Z",
    "changeDetected": true,
    "severityScore": 85,
    "changeType": "content_modified",
    "diffSummary": {
        "text": "Price changed from $10 to $12",
        "structured": [
            {
                "path": "div.price[0]",
                "old": "$10",
                "new": "$12",
                "type": "modified"
            }
        ]
    },
    "aiAnalysis": {
        "summary": "Price increased by 20%.",
        "reasoning": "Competitor adjusted monthly subscription rate."
    }
}
```

---

## 💰 Cost & Performance

-   **Cost**: Efficient. Runs on minimal memory.
-   **AI Cost**: If `useAi` is enabled, small additional cost (bring your own key or use default).
-   **Frequency**: Recommended to run hourly for pricing and inventory.

---
