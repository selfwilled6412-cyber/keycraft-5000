# KEY CRAFT 5000 — Premium UI v2 Acceptance

このブランチは「動く」だけでは合格にしない。人間が初見でゲームとして価値を感じ、成果物をそのまま納品できることを合格条件とする。

## 1. Human-eye game quality

- 拠点は雪原にオブジェクトを置いただけではなく、道路・住宅・主要施設・照明・人物・炎・降雪を含む「稼働している都市」に見える。
- 拠点 / CRAFT MAP / 英雄 / MISSION / 実績 / タイピング画面 / 成果物が同じ世界観で統一される。
- タイピング中も教材画面に戻らず、ゲーム内MISSIONを遂行している見た目を維持する。
- 仮線画SVGやグレーのプレースホルダーを主役にしない。

## 2. Deliverables are products, not reports

成果物は1600×900 PNGを基本とし、単体で開いても「制作物」として成立する。

- CURRENT SETTLEMENT: 現在の街・完成ポスター
- MISSION CLEAR: 完成MISSION / 建物 / 報酬
- DISTRICT COMPLETE: 10 CRAFT完成時の地区記念ボード
- HERO UNLOCK: 新しい英雄・クルー加入カード

利用者のフレーズ数・MISSION数・地区・解放状態が画像へ反映される。

## 3. Automatic production is mandatory

利用者に「PNGを作る」操作を要求しない。

MISSIONの20フレーズ目がD1へ正常保存された後に、自動で:

1. `MISSION CLEAR` PNGを生成する。
2. `CURRENT SETTLEMENT` PNGを最新状態へ更新する。
3. 10MISSION区切りで該当DISTRICTが10/10になった場合、`DISTRICT COMPLETE` PNGを生成する。
4. 英雄解放MISSIONに到達した場合、`HERO UNLOCK` PNGを生成する。
5. PNGをCloudflare R2へ保存する。
6. D1 `deliverables` 台帳へ種類・イベントID・ファイル名・サイズ・メタデータ・作成日時を記録する。
7. 成果物ページの「自動納品庫」に自動表示する。

同じイベントを再送しても `(key_id, event_key)` により重複成果物を増やさない。`current-settlement` は常に最新の1枚へ更新する。

## 4. Self-healing / historical backfill

成果物ページを開いた時、D1の完成MISSIONとR2/D1成果物台帳を比較する。

- 過去のMISSION CLEARが不足していれば自動復元する。
- DISTRICT COMPLETEが不足していれば自動復元する。
- HERO UNLOCKが不足していれば自動復元する。
- CURRENT SETTLEMENTが古ければ最新状態へ再生成する。
- 通信失敗等で成果物だけ抜けても、次回成果物ページを開いた時に不足分だけ補完する。

進捗保存と成果物保存は分離し、成果物保存失敗でタイピング進捗を失わない。

## 5. Storage / privacy

- PNG本体はprivate Cloudflare R2 bucketに保存する。
- D1にはPNG本体を保存せず台帳情報のみ保存する。
- ファイル参照はKEY IDと成果物IDの組み合わせでWorker API経由に限定する。
- R2 bucketを公開Webサイトとして公開しない。
- stagingはproductionとは別のD1 / R2 / Workerを使用する。

## 6. Verification gates

PRをproductionへ入れる前に最低限すべてPASSさせる。

- content validation: 5 zones / 25 districts / 250 missions / 5,000 unique phrases / 250 unique rewards
- lint
- TypeScript
- unit tests
- production build
- Wrangler dry-run
- runtime smoke
- Local D1 + R2 deliverables E2E:
  - Worker起動
  - テスト利用者作成
  - PNG multipart upload
  - D1台帳登録
  - R2保存
  - 一覧取得
  - R2からPNG再取得
  - 元ファイルとのbyte一致
- Visual Review: 主要ゲーム画面と実PNG出力を実ブラウザで撮影
- staging実ブラウザ確認
- staging R2で自動保存 / 自動復元確認

## 7. Production safety

- PRは明示承認までDraft / unmergedを維持する。
- production Worker / D1 / R2をstaging検証のために変更しない。
- stagingにはproduction D1から指定された検証利用者データだけをread-only SELECTでコピーする。
