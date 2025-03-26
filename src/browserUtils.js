"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrowser = createBrowser;
exports.extractHtmlContent = extractHtmlContent;
exports.getFinalUrl = getFinalUrl;
const playwright_1 = require("playwright");
/**
 * Chromiumブラウザインスタンスを作成し、新しいコンテキストおよびページを生成します。
 * @return {Promise<{browser: Browser, page: Page}>} 作成されたブラウザインスタンスおよびページオブジェクトを含むオブジェクトを返します。
 */
function createBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield playwright_1.chromium.launch({
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
        const context = yield browser.newContext();
        const page = yield context.newPage();
        return { browser, page };
    });
}
/**
 * 指定されたページオブジェクトからHTMLコンテンツを抽出します。
 *
 * @param {Page} page HTMLコンテンツを取得する対象のページオブジェクト
 * @return {Promise<string>} ページのHTMLコンテンツを返します
 */
function extractHtmlContent(page) {
    return __awaiter(this, void 0, void 0, function* () {
        return page.content();
    });
}
/**
 * 指定したページ内の「詳細情報をみる」リンクから最終的なURLを取得します。
 *
 * @param {Page} page PlaywrightのPageオブジェクト。対象とするページを指定します。
 * @return {Promise<string | null>} 最終的なURLを文字列として返します。リンクが存在しない場合はnullを返します。
 */
function getFinalUrl(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const finalUrl = yield page.locator('text=詳細情報をみる').getAttribute('href');
        return finalUrl ? new URL(finalUrl, page.url()).toString() : null;
    });
}
