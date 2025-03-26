import { IncomingMessage, ServerResponse } from "http";
import { createBrowser, getFinalUrl, extractHtmlContent } from "./browserUtils";

/**
 * HTTP GETリクエストを処理する関数。
 *
 * @param {IncomingMessage} req クライアントからのHTTPリクエストオブジェクト。
 * @param {ServerResponse} res サーバーがクライアントに返すHTTPレスポンスオブジェクト。
 * @return {Promise<void>} 処理が完了するPromiseオブジェクトを返却する。
 */
export async function handleGetRequest(req: IncomingMessage, res: ServerResponse) {
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
        const { page } = await createBrowser();
        await blockUnnecessaryResources(page);

        const finalUrl = await getFinalUrl(page);
        const htmlContent = await extractHtmlContent(page);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ finalUrl, html: htmlContent }));
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error processing request:", error.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `Error: ${error.message}` }));
        } else {
            console.error("Unknown error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unknown error occurred" }));
        }
    }
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
function getRequestParams(req: IncomingMessage) {

    //以下にパラメータ毎の処理を分けたり、色々ゴニョゴニョしてください。以下は参考です。
    const reqUrl = new URL(req.url!, `https://${req.headers.host}`);
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
async function blockUnnecessaryResources(page: any) {
    await page.route('**/*', (route: any) => {
        const resourceType = route.request().resourceType();
        if (['stylesheet', 'image', 'font', 'script'].includes(resourceType)) {
            route.abort();
        } else {
            route.continue();
        }
    });
}
