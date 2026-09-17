# KEY CRAFT 5000 — Productization

## Product promise

KEY CRAFT 5000 is not a typing report generator. The typing work itself grows a game world and produces visual deliverables that can be handed to a client as artifacts.

Core promise:

> 利用者はタイピングする。システムはその結果を街・MISSION・英雄の作品へ変え、クラウドへ自動保存する。

## Automatic deliverable pipeline

```text
利用者がタイピング
  ↓
20フレーズ目を完了
  ↓
D1へ進捗保存成功
  ↓
MISSION COMPLETE確定
  ↓
ブラウザ内で1600×900 PNGを自動生成
  ├─ MISSION CLEAR（履歴保存）
  ├─ CURRENT SETTLEMENT（常に最新へ更新）
  ├─ DISTRICT COMPLETE（10/10時だけ）
  └─ HERO UNLOCK（解放MISSION時だけ）
  ↓
Worker APIへmultipart upload
  ↓
Cloudflare R2 private bucketへPNG保存
  ↓
Cloudflare D1 deliverables台帳へ登録
  ↓
成果物ページ「自動納品庫」へ自動表示
```

利用者側にはPNG生成操作を要求しない。

## Storage model

### D1

D1は進捗と成果物台帳を持つ。

- user / preferences / progress / mission_completions
- deliverables
  - kind
  - event_key
  - filename
  - object_key
  - content type
  - byte size
  - metadata
  - created_at

PNG本体はD1へ保存しない。

### R2

PNG本体はprivate R2 bucketへ保存する。

Object key example:

```text
ABC234/mission_clear/mission_m001.png
ABC234/current_settlement/current-settlement.png
ABC234/district_complete/district_d01.png
ABC234/hero_unlock/hero_rhea.png
```

`current-settlement` は同じobject keyを上書きし、履歴MISSION等はevent key単位で一意に残す。

## Idempotency

`deliverables` は `(key_id, event_key)` をUNIQUEにする。

同じMISSIONの完了通知やアップロードが再実行されても、同じ成果物を大量に複製しない。

## Self-healing

成果物ページはD1の進捗と成果物台帳を比較する。

過去分が無い、または通信失敗で成果物だけ抜けた場合は不足eventだけ自動生成してR2へ補完する。

これにより、Premium UI導入前に進んでいた既存利用者も、成果物ページを開けば過去MISSION分を再構成できる。

## Failure isolation

進捗保存を最優先にする。

1. D1 progress / mission completionを保存
2. その後に成果物PNGを生成・R2保存

PNG側が失敗してもタイピング進捗は失わない。成果物は次回の自動補完で復元する。

## Current Premium v2 deliverable types

1. `CURRENT SETTLEMENT`
   - 現在の街の完成ポスター
   - 進捗・都市LEVEL・地区CRAFT・クルーを表示
2. `MISSION CLEAR`
   - MISSION番号・タイトル・建物・報酬
3. `DISTRICT COMPLETE`
   - 10/10 CRAFT完成地区の記念ボード
4. `HERO UNLOCK`
   - 新加入クルーの記念カード

## Verification

Before production:

- content validation
- lint
- TypeScript
- unit tests
- build
- Wrangler dry-run
- runtime smoke
- local D1 + R2 upload/list/file roundtrip E2E
- real-browser 20th-phrase → mission complete → automatic PNG → D1/R2 E2E
- visual review
- staging Worker + staging D1 + staging R2
- existing user historical backfill verification

Production main remains untouched until explicit approval.
