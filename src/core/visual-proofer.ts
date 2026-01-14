import puppeteer from 'puppeteer';
import { KeyValueStore } from 'apify';
import { log } from 'apify';

export class VisualProofer {
    static async capture(url: string, selector: string | undefined): Promise<string | null> {
        let browser;
        try {
            log.info('📸 Starting Visual Proof capture...');
            browser = await puppeteer.launch({
                headless: true, // Use new headless mode if possible, but 'true' is safe
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();

            // Set viewport to standard desktop
            await page.setViewport({ width: 1280, height: 800 });

            log.info(`navigating to ${url}`);
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            let screenshotBuffer: Buffer | Uint8Array;

            if (selector) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    const element = await page.$(selector);
                    if (element) {
                        // Add red border style for emphasis
                        await page.evaluate((sel) => {
                            const el = document.querySelector(sel);
                            if (el instanceof HTMLElement) {
                                el.style.border = '5px solid red';
                                el.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
                            }
                        }, selector);

                        screenshotBuffer = await element.screenshot();
                    } else {
                        throw new Error('Element not found');
                    }
                } catch (e) {
                    log.warning(`Could not screenshot specific selector, falling back to full page. Error: ${(e as Error).message}`);
                    screenshotBuffer = await page.screenshot({ fullPage: true });
                }
            } else {
                screenshotBuffer = await page.screenshot({ fullPage: true });
            }

            // Save to Key-Value Store
            const key = `proof-${Date.now()}.png`;
            await KeyValueStore.setValue(key, screenshotBuffer, { contentType: 'image/png' });

            // Generate Public URL
            // Apify Default KVS Public URL format:
            // https://api.apify.com/v2/key-value-stores/{storeId}/records/{key}
            const storeId = (await KeyValueStore.open()).id;
            const publicUrl = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${key}`;

            log.info(`📸 Visual Proof captured: ${publicUrl}`);
            return publicUrl;

        } catch (error) {
            log.error(`❌ Visual Proof failed: ${(error as Error).message}`);
            return null;
        } finally {
            if (browser) await browser.close();
        }
    }
}
