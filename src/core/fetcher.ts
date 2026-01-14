import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';
import { Actor } from 'apify';

export interface IFetcher {
    fetch(url: string, cssSelector?: string): Promise<{ html: string; $: cheerio.CheerioAPI }>;
}

export class CheerioFetcher implements IFetcher {
    /**
     * sovereign: Stealth Fetching Engine
     */
    async fetch(url: string, cssSelector?: string, proxyConfigOptions?: any): Promise<{ html: string; $: cheerio.CheerioAPI }> {
        const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigOptions);
        const proxyUrl = await proxyConfiguration?.newUrl();

        // Anti-blocking: Randomize browser profiles and dimensions
        const browsers: Array<'chrome' | 'firefox' | 'edge'> = ['chrome', 'firefox', 'edge'];
        const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];

        const response = await gotScraping({
            url,
            proxyUrl,
            headerGeneratorOptions: {
                browsers: [
                    { name: randomBrowser, minVersion: 100 },
                ],
                devices: ['desktop'],
                locales: ['en-US', 'en-GB'],
                httpVersion: '2',
            },
            // Advanced Stealth: Randomization & HTTP2
            retry: {
                limit: 2,
                methods: ['GET'],
                statusCodes: [403, 404, 429, 500, 502, 503, 504],
            },
            timeout: {
                request: 30000,
            }
        });

        const $ = cheerio.load(response.body) as any;

        // sovereign: Extract targeted semantic blocks
        let targetHtml = '';
        if (cssSelector) {
            $(cssSelector).each((_: number, el: any) => {
                targetHtml += $.html(el) + '\n';
            });

            // If selector returns nothing, we return the body to trigger Sovereign Healing later
            if (targetHtml.trim() === '') {
                targetHtml = response.body;
            }
        } else {
            targetHtml = response.body;
        }

        return {
            html: targetHtml.trim(),
            $,
        };
    }
}
