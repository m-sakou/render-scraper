import { chromium, Browser, Page } from 'playwright';

// HTMLを取得する非同期関数
async function scrapeHTML(url: string): Promise<string> {
    // ヘッドレスモードでブラウザを起動
    const browser: Browser = await chromium.launch({ headless: true });
    const page: Page = await browser.newPage();

    // 指定されたURLに移動
    await page.goto(url);

    // ページのHTML全体を取得
    const html: string = await page.content(); // ページのHTMLを取得

    // ブラウザを閉じる
    await browser.close();

    return html; // HTMLをそのまま返す
}

// モジュールとしてscrapeHTML関数をエクスポート
export { scrapeHTML };
