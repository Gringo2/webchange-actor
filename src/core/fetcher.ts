import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';
import { Actor } from 'apify';

export interface IFetcher {
    fetch(url: string, cssSelector?: string): Promise<{ html: string; $: cheerio.CheerioAPI }>;
}

export class CheerioFetcher implements IFetcher {
    async fetch(url: string, cssSelector?: string, proxyConfigOptions?: any): Promise<{ html: string; $: cheerio.CheerioAPI }> {
        const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigOptions);

        const proxyUrl = await proxyConfiguration?.newUrl();

        const response = await gotScraping({
            url,
            proxyUrl,
            headerGeneratorOptions: {
                browsers: [
                    { name: 'chrome', minVersion: 100 },
                    { name: 'firefox', minVersion: 100 },
                ],
                devices: ['desktop'],
                locales: ['en-US'],
            },
        });

        const $ = cheerio.load(response.body) as any;

        // Extract all matching elements and join them to capture lists/grids
        let targetHtml = '';
        if (cssSelector) {
            $(cssSelector).each((_: number, el: any) => {
                targetHtml += $.html(el) + '\n';
            });
        } else {
            targetHtml = response.body;
        }

        return {
            html: targetHtml.trim(),
            $,
        };
    }
}
