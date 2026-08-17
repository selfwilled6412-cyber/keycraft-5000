# KEY CRAFT 5000

**打つほど、世界ができていく。**

KEY CRAFT 5000 は、一般ユーザー向けの無料タイピングゲームです。5つのゾーンを巡り、250のMISSIONと5,000の日本語フレーズを打って、自分だけの街を完成させます。メールアドレスやパスワードは不要で、6文字のKEY IDだけで続きを遊べます。

## 収録内容

- 5 ZONE / 25 DISTRICT / 250 MISSION
- 1 MISSIONあたり20問、合計5,000問（重複なし）
- MISSIONごとに異なる250個のクラフト報酬
- 初心者・標準・チャレンジの3アシストモード
- し/shi・si、ち/chi・ti、つ/tsu・tu、促音、撥音などを受理するローマ字入力エンジン
- 指ガイド、次キー表示、画面キーボード、ミスキー集計
- KEY IDによる端末をまたいだ再開とD1への進捗保存

## 技術構成

- UI: React 19 / TypeScript / Vite
- API: Cloudflare Workers
- データベース: Cloudflare D1
- 配信: Workers Static Assets（`/api/*` のみWorkerを先に実行）
- テスト: Vitest / Cloudflare Workers test pool
- CI: GitHub Actions

フロントエンドの静的ファイルとAPIを1つのWorkerから配信します。ブラウザの `localStorage` には最後に使ったKEY IDだけを保存し、設定・進捗・報酬解放はD1を正本とします。問題データはビルド時生成ですが、同じ入力から同じ5,000問が再現されます。

## ローカル起動

Node.js 22以上を推奨します。

```bash
npm ci
npm run types:worker
npx wrangler d1 migrations apply keycraft-5000-db --local
npm run dev
```

表示されたURL（通常は `http://localhost:8787`）を開きます。UIだけを確認する場合は `npm run dev:ui` も使えますが、KEY IDや進捗APIにはWorkerが必要です。

## 問題データ

問題の素材は `src/content/source.ts`、決定論的な生成処理は `scripts/content-builder.ts` にあります。

```bash
npm run generate
npm run validate:content
npm run stats:content
```

検証では、ゾーン・地区・MISSION・問題・報酬の件数、ID参照、各MISSIONの20問、テキストの一意性、レベル別文字数を確認します。生成物は `src/content/generated/content.json` です。

## 品質確認

```bash
npm run check
npm run deploy:dry
```

`check` はデータ検証、ESLint、TypeScript、単体/APIテスト、本番ビルド、成果物スモークテストを順に実行します。CIも同じ検査に加え、生成済みコンテンツに差分がないことを確認します。

## Cloudflareへのデプロイ

1. 専用D1を作成します。

   ```bash
   npx wrangler d1 create keycraft-5000-db
   ```

2. 表示された `database_id` を `wrangler.jsonc` のD1設定へ記入します。
3. スキーマとアプリをデプロイします。

   ```bash
   npx wrangler d1 migrations apply keycraft-5000-db --remote
   npm run deploy
   ```

本プロジェクトは `keycraft-5000` / `keycraft-5000-db` という専用名だけを使います。他のWorkerやD1を参照・変更しません。

## API概要

- `GET /api/health` — 稼働確認
- `POST /api/users` — 6文字KEY IDを新規発行
- `POST /api/session` — KEY IDから設定・進捗を復元
- `PUT /api/preferences` — ニックネーム、アシスト、好みジャンルを保存
- `POST /api/progress/phrase` — 1問の完了を冪等保存

進捗の主キーは `(key_id, phrase_id)` です。同じ完了通知が再送されても二重計上されません。入力JSONにはサイズ上限を設け、全SQLはD1のバインド変数を使用します。

## 主なディレクトリ

```text
src/content/        世界・MISSION・問題データ
src/core/typing/    ローマ字入力状態機械と指割り当て
src/pages/          HOME / MAP / MISSION / PLAY / 進み具合 / 設定
worker/             Cloudflare Worker API
migrations/         D1スキーマ
scripts/            生成・検証・統計・スモークテスト
test/               入力エンジン・コンテンツ・Worker APIテスト
```

## プライバシー

登録不要です。KEY IDは秘密情報として扱ってください。公開プロフィール、広告SDK、外部画像・外部フォント、行動追跡用スクリプトは使用していません。

