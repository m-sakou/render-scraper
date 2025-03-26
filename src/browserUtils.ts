import { chromium, Browser, Page } from "playwright";

/**
 * Chromiumブラウザインスタンスを作成し、新しいコンテキストおよびページを生成します。
 * @return {Promise<{browser: Browser, page: Page}>} 作成されたブラウザインスタンスおよびページオブジェクトを含むオブジェクトを返します。
 */
export async function createBrowser() {
    const browser: Browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-extensions',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-networking',
            '--disable-sync',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--no-zygote',
            '--disable-default-apps',
        ],
    });

    const context = await browser.newContext();
    const page: Page = await context.newPage();

    return { browser, page };
}

/**
 * 指定されたページオブジェクトからHTMLコンテンツを抽出します。
 *
 * @param {Page} page HTMLコンテンツを取得する対象のページオブジェクト
 * @return {Promise<string>} ページのHTMLコンテンツを返します
 */
export async function extractHtmlContent(page: Page) {
    return page.content();
}

/**
 * 指定したページ内の「詳細情報をみる」リンクから最終的なURLを取得します。
 *
 * @param {Page} page PlaywrightのPageオブジェクト。対象とするページを指定します。
 * @return {Promise<string | null>} 最終的なURLを文字列として返します。リンクが存在しない場合はnullを返します。
 */
export async function getFinalUrl(page: Page): Promise<string | null> {
    const finalUrl = await page.locator('text=詳細情報をみる').getAttribute('href');
    return finalUrl ? new URL(finalUrl, page.url()).toString() : null;
}
