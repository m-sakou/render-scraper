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
exports.handleGetRequest = handleGetRequest;
const browserUtils_1 = require("./browserUtils");
/**
 * HTTP GETリクエストを処理する関数。
 *
 * @param {IncomingMessage} req クライアントからのHTTPリクエストオブジェクト。
 * @param {ServerResponse} res サーバーがクライアントに返すHTTPレスポンスオブジェクト。
 * @return {Promise<void>} 処理が完了するPromiseオブジェクトを返却する。
 */
function handleGetRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== "GET") {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not Found" }));
            return;
        }
        const { targetUrl, secondUrl, javaScriptEnabled } = getRequestParams(req);
        if (!targetUrl) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing or invalid 'url' parameter" }));
            return;
        }
        try {
            const { page } = yield (0, browserUtils_1.createBrowser)();
            yield blockUnnecessaryResources(page);
            const finalUrl = yield (0, browserUtils_1.getFinalUrl)(page);
            const htmlContent = yield (0, browserUtils_1.extractHtmlContent)(page);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ finalUrl, html: htmlContent }));
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Error processing request:", error.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Error: ${error.message}` }));
            }
            else {
                console.error("Unknown error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Unknown error occurred" }));
            }
        }
    });
}
/**
 * 指定されたリクエストオブジェクトからクエリパラメータを解析して取得します。
 *
 * @param {IncomingMessage} req HTTPリクエストオブジェクト
 * @return {Object} クエリパラメータを格納したオブジェクト。以下のプロパティを含みます:
 * - targetUrl: "url" クエリパラメータの値
 * - secondUrl: "url2" クエリパラメータの値
 * - javaScriptEnabled: "js" クエリパラメータが "true" の場合は true、そうでない場合は false
 */
function getRequestParams(req) {
    //以下にパラメータ毎の処理を分けたり、色々ゴニョゴニョしてください。以下は参考です。
    const reqUrl = new URL(req.url, `https://${req.headers.host}`);
    const targetUrl = reqUrl.searchParams.get("url");
    const secondUrl = reqUrl.searchParams.get("url2");
    const jsParam = reqUrl.searchParams.get("js");
    return {
        targetUrl,
        secondUrl,
        javaScriptEnabled: jsParam === "true",
    };
}
/**
 * 指定されたページで不要なリソースの読み込みをブロックします。
 *
 * @param {object} page ページオブジェクト。操作対象のブラウザページを表します。
 * @return {Promise<void>} 非同期操作が完了した際に解決するPromiseオブジェクト。
 */
function blockUnnecessaryResources(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            if (['stylesheet', 'image', 'font', 'script'].includes(resourceType)) {
                route.abort();
            }
            else {
                route.continue();
            }
        });
    });
}
