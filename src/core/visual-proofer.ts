import { Actor } from 'apify';
import puppeteer from 'puppeteer';
import { log } from 'apify';

export class VisualProofer {
    static async capture(url: string, selector: string | undefined, contextSelector?: string, waitForSelector?: string): Promise<string | null> {
        let browser;
        try {
            log.info('📸 Starting Visual Proof capture...');
            browser = await puppeteer.launch();
            const page = await browser.newPage();

            // Set viewport to standard desktop
            await page.setViewport({ width: 1280, height: 800 });

            log.info(`navigating to ${url}`);
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            let screenshotBuffer: Buffer | Uint8Array | null = null;

            if (selector) {
                try {
                    if (waitForSelector) {
                        log.info(`⏳ Waiting for custom selector: ${waitForSelector}...`);
                        await page.waitForSelector(waitForSelector, { timeout: 10000 });
                    }
                    await page.waitForSelector(selector, { timeout: 5000 });
                    const element = await page.$(selector);
                    if (element) {
                        // Add highlighting for both delta and context
                        await page.evaluate((sel, ctxSel) => {
                            const mainEl = document.querySelector(sel);
                            if (mainEl instanceof HTMLElement) {
                                mainEl.style.border = '5px solid red';
                                mainEl.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
                                mainEl.style.zIndex = '9999';
                            }

                            if (ctxSel) {
                                const ctxEl = document.querySelector(ctxSel);
                                if (ctxEl instanceof HTMLElement) {
                                    ctxEl.style.border = '5px solid #007bff';
                                    ctxEl.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.4)';
                                    ctxEl.style.zIndex = '9998';
                                }
                            }
                        }, selector, contextSelector || '');

                        screenshotBuffer = await element.screenshot();
                    } else {
                        log.warning(`Element ${selector} not found for screenshot, taking full page.`);
                        screenshotBuffer = await page.screenshot();
                    }
                } catch (e) {
                    log.warning(`Visual proof failed for selector ${selector}, falling back to full page: ${(e as Error).message}`);
                    screenshotBuffer = await page.screenshot();
                }
            } else {
                screenshotBuffer = await page.screenshot();
            }

            if (screenshotBuffer) {
                const store = await Actor.openKeyValueStore();
                const key = `proof_${Date.now()}.png`;
                await store.setValue(key, screenshotBuffer, { contentType: 'image/png' });
                return store.getPublicUrl(key);
            }

            return null;
        } catch (error) {
            log.error(`❌ Visual Proof failed: ${(error as Error).message}`);
            return null;
        } finally {
            if (browser) await browser.close();
        }
    }
}
