## 概要
以下のTypeScriptコードでは、HTTP GETリクエストを処理し、指定されたURLにアクセスしてそのページの最終URL（リダイレクト先など）やHTMLコンテンツを取得するという動作を実現しています。このコードを分割して説明します。

---

### **1. 主な機能概要**
コードはHTTPサーバーのGETリクエストを処理するためのハンドラー`handleGetRequest`を定義しています。以下のような流れになります：
1. リクエストが**GET**メソッド以外の場合は404エラーを返す。
2. `url`パラメータ（必要）とその他のオプションのパラメータ（`url2`, `js`）を取得。
3. 対象のURL（`url`）が存在しない場合は400エラーを返す。
4. Playwright（ヘッドレスブラウザ）を利用して指定されたURLを開き、必要な処理を行う。
5. 取得したページの最終URLとHTMLの内容をクライアントに返す。

---

### **2. 各部の詳細な役割**

#### **a. GETリクエストのエラーチェック**
最初にリクエストのメソッドを確認し、GET以外のメソッドの場合は404エラーを返します。

```typescript
if (req.method !== "GET") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
    return;
}
```

これにより、他のHTTPメソッド（POST, PUT など）のリクエストを拒否します。

#### **b. リクエストのパラメータ取得**
次に`url`パラメータが存在しない場合、クライアントに400エラーを返します。`url`, `url2`, `js`パラメータは以下の関数で取得されます。

```typescript
function getRequestParams(req: IncomingMessage) {
    const reqUrl = new URL(req.url!, `https://${req.headers.host}`);
    const targetUrl = reqUrl.searchParams.get("url");
    const secondUrl = reqUrl.searchParams.get("url2");
    const jsParam = reqUrl.searchParams.get("js");
    return {
        targetUrl,
        secondUrl,
        javaScriptEnabled: jsParam === "true", // true/falseを判定
    };
}
```

この関数のポイント：
- **`targetUrl`**: メイン処理で使用する必須のURL。
- **`secondUrl`**: 特定状況で必要な二次的なURL。
- **`javaScriptEnabled`**: クエリ内の`js`パラメータが`true`であるかを判定。

たとえば、リクエストが次の場合:

```
GET /?url=https://example.com&url2=https://second.com&js=true
```
これにより、以下の値が返ります:
- `targetUrl`: `https://example.com`
- `secondUrl`: `https://second.com`
- `javaScriptEnabled`: `true`

---

#### **c. Playwrightブラウザの使用**
リクエスト処理の主要な部分では、`createBrowser`関数でヘッドレスブラウザを起動し、指定したURLを開きます。

その後、以下のステップを実行します：

```typescript
const { browser, page } = await createBrowser();
await blockUnnecessaryResources(page);  // 不要なリソースをブロック
await page.goto(targetUrl, { timeout: 60000 });  // ターゲットURLへのアクセス
await page.waitForLoadState("load");  // ページの完全ロードを待機
```

- **`createBrowser`**:
  > Chromiumベースのブラウザを起動し、最適化設定を用いて新しいブラウザコンテキストとページを返す。

- **`blockUnnecessaryResources`**:
  > ページ内で不要なリソース（画像ファイル、CSS、フォントなど）をブロックしてパフォーマンスを向上。

```typescript
async function blockUnnecessaryResources(page: any) {
    await page.route('**/*', (route: any) => {
        const resourceType = route.request().resourceType();
        // Stylesheet, Image, Font, Scriptをブロック
        if (['stylesheet', 'image', 'font', 'script'].includes(resourceType)) {
            route.abort();
        } else {
            route.continue();
        }
    });
}
```

=> ブラウザリソースを最小限にして効率を向上させ、リクエストの実行速度を改善します。

---

#### **d. 特別なフォーム送信（オプション）**
特定の条件（`twi-dl.net`がURL内に含まれるかつ`secondUrl`が存在する）が合致する場合、以下でフォーム送信を実行します：

```typescript
if (targetUrl.includes("twi-dl.net") && secondUrl) {
    await handleFormSubmission(page, secondUrl);
}
```

このフォーム送信処理は以下の関数で実現されます：

```typescript
async function handleFormSubmission(page: any, secondUrl: string) {
    await page.fill('input[name="text"]', secondUrl);  // テキスト入力
    await page.click('input[type="submit"]');  // フォーム送信ボタンを押す
}
```

---

#### **e. 結果の抽出と返答**
対象のページの最終URL（リダイレクト先を含む）とHTMLコンテンツを取得します：

```typescript
const finalUrl = await getFinalUrl(page); // ページの実際の最終URL
const htmlContent = await extractHtmlContent(page); // HTMLコンテンツ文字列を抽出
```

そして、JSON形式でクライアントに返します。

```typescript
res.writeHead(200, { "Content-Type": "application/json" });
res.end(JSON.stringify({ finalUrl, html: htmlContent })); // レスポンスデータを送信
```

例：
```json
{
  "finalUrl": "https://example.com/final",
  "html": "<html>...</html>"
}
```

---

#### **f. エラーハンドリング**
もしエラーが発生した場合はエラー内容を出力し、「500 Internal Server Error」を返す設計になっています。

```typescript
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
```

=> これにより予期せぬエラーが発生してもサーバーがクラッシュすることを防ぎます。

---

### **3. コード全体の流れ**
1. リクエストを受信し、GETメソッドかを確認。
2. クエリパラメータを取得し、必須の`url`をチェック。
3. Playwrightブラウザを起動し、指定したURLにアクセス（場合によってはフォーム送信）。
4. 実際の最終URLとHTMLコンテンツを取得。
5. JSON形式で結果をクライアントにレスポンス。
6. エラーが発生した場合は適切に処理。

---

このコードは、外部リソースに依存したデータ取得およびHTML解析タスクに利用されることが想定されています。たとえば、リンクの展開サービスやスクレイピングアプリケーションのようなものです。

### **全体的な処理の流れ**
1. **GETリクエストの検証**  
   リクエストがGETメソッドであるかを確認し、その他のメソッドなら404エラーを返します。

2. **リクエストパラメータの取得**  
   クエリパラメータ（`url`や`url2`）を取得し、必須の`url`が指定されていなければ400エラーを返します。

3. **Playwrightによるブラウザ操作**
    - **ブラウザ起動**: 最適化設定でChromium（ヘッドレスモード）を起動します。
    - **不要なリソースをブロック**: CSSや画像などの不要なリソースをブロックして効率を向上させます。
    - **指定URLにアクセス**: クエリの`targetUrl`にアクセスし、ページがロード完了するまで待機。
    - **フォーム送信（特定条件下）**: `twi-dl.net`が含まれる場合はパラメータ`url2`を利用してフォーム送信をシミュレート。

4. **結果の抽出**
    - ページの最終URL（リダイレクト処理後のURL）を取得。
    - ページのHTMLコンテンツも抽出し、両方をJSON形式でレスポンスします。

5. **エラーハンドリング**  
   未知のエラーやブラウザ操作中の問題が発生しても、500エラーとして適切に処理。

### **主な機能の利用シーン**
- **スクレイピングAPI**: 動的なWebページを処理したい場合（例: JavaScriptレンダリングを伴うページのHTML取得）。
- **リンクのリダイレクト先確認**: 最終URLを取得することで、リダイレクト検証や短縮URLの展開を行える。
- **特定フォームの送信操作**: 自動化されたフォーム入力と送信作業（特定のドメインでの利用を想定）。

### **特徴と設計のポイント**
- **ヘッドレスブラウザを活用**: Playwrightによる扱いやすいブラウザ操作。
- **効率化**: 不要なリソースをブロックすることで処理速度を向上。
- **柔軟な処理**: 特定状況（例: `twi-dl.net`）で追加動作を実行可能。
- **エラーハンドリング**: 不測のエラーにも堅牢に対応。

このコードは、シンプルながら重要なスクレイピングやAPI設計の基本を構成しており、特にWebベースのデータ取得や解析に役立てられるものです。


## スクレイピングで気をつけること

スクレイピングを行う際には、以下の点に注意してください：

### **1. 法律や規約を遵守する**
- スクレイピングで利用する対象のWebサイトの利用規約（Terms of Service）を必ず確認してください。
- 多くのWebサイトでは、無断でのデータ取得を禁止または制限している場合があります。
- 著作権やデータ保護法などの関連法を遵守してください。

### **2. サーバーへの負荷を最小限に**
- サイトへのリクエスト頻度を適切に制限してください（例: 短時間で大量のリクエストを送らない）。
- 自分の行為が対象Webサイトに過度な負荷をかけないようにします。

### **3. ロボットテキスト（robots.txt）の確認**
- 指定されたページ（URL）がロボットによるアクセスを許可しているか（`robots.txt`ファイル）を確認するべきです。
- 一般的に、許可されていないパスへのスクレイピングを行うべきではありません。

### **4. 個人情報保護への配慮**
- 取得データに個人情報が含まれる場合、そのデータの保存や利用方法に注意し、適切に取り扱ってください。

### **5. IPアドレスのブロックに注意**
- サイトによっては、一定以上のアクセスでIPアドレスのブロック措置が取られる場合があります。
- できるだけ正当な目的で利用し、アクセスログが無制限に蓄積されないようにしてください。

### **6. 正確なユーザーエージェントを使用**
- スクレイピング中のリクエストに適切なユーザーエージェントを設定し、正しい意図を示しましょう。

---

## 注意点

- `url`は必須パラメータで、その他は任意パラメータとして扱われます。
- Playwrightを使用しており、実行環境に依存する場合があります（例: Chromiumのインストール）。
- セキュリティ上、提供されるURLを慎重に確認してください。

---

## 貢献

本プロジェクトへの貢献を歓迎します！バグ報告、提案、またはプルリクエストをお待ちしています。

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/my-feature`)
3. コードをコミット (`git commit -m 'Add my feature'`)
4. プッシュ (`git push origin feature/my-feature`)
5. プルリクエストを作成

---

## ライセンス

このプロジェクトはMITライセンスのもとで提供されています。詳細については、[LICENSE](LICENSE) を参照してください。
```
