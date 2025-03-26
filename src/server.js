"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const requestHandler_1 = require("./requestHandler"); // リクエスト処理をモジュール化
/**
 * PORT変数はアプリケーションが使用するポート番号を定義します。
 * 設定済みの環境変数 `process.env.PORT` の値を優先的に使用し、
 * 指定がない場合はデフォルトで 3000 を使用します。
 *
 * この変数はサーバーの接続をリッスンするために必要です。
 */
const PORT = process.env.PORT || 3000; // サーバーポート設定
/**
 * `server`は、HTTPリクエストを処理するために作成されたサーバーオブジェクトです。
 * このサーバーはGETリクエストを受け取ると、指定されたハンドラクション `handleGetRequest` を使用して処理を行います。
 *
 * `http.createServer` メソッドを使用して作成され、イベント駆動型の仕組みに基づいて動作します。
 *
 * 主に以下の機能を提供します:
 * - クライアントからのリクエストをリッスン
 * - 適切な処理関数を用いてリクエストを処理
 * - レスポンスをクライアントに返す
 *
 * 適切なポートを指定してリクエストをリッスンできるよう設定してください。
 */
const server = http_1.default.createServer(requestHandler_1.handleGetRequest);
// サーバーの起動
server.listen(PORT, () => {
    const serviceUrl = process.env.RENDER_EXTERNAL_URL || "URL not found";
    console.log(`Server started at: ${serviceUrl}:${PORT}`);
});
