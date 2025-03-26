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
exports.scrapeHTML = scrapeHTML;
const playwright_1 = require("playwright");
// HTMLを取得する非同期関数
function scrapeHTML(url) {
    return __awaiter(this, void 0, void 0, function* () {
        // ヘッドレスモードでブラウザを起動
        const browser = yield playwright_1.chromium.launch({ headless: true });
        const page = yield browser.newPage();
        // 指定されたURLに移動
        yield page.goto(url);
        // ページのHTML全体を取得
        const html = yield page.content(); // ページのHTMLを取得
        // ブラウザを閉じる
        yield browser.close();
        return html; // HTMLをそのまま返す
    });
}
