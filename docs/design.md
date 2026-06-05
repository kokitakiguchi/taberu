# Taberu 詳細仕様

最終更新：2026-06-05

このドキュメントは人間向けの詳細仕様です。実装コードと `migrations/` が最上位の正本で、この文書はそれに追従します。短い入口は [README.md](../README.md)、エージェント運用は [CLAUDE.md](../CLAUDE.md) と `.claude/` を参照してください。

## 概要

Taberu は、食事を時系列で記録し、Claude API で栄養分析するシングルユーザー向け Web アプリです。現在は認証なしで `user_id = 1` 固定運用です。

### 実装済み

- 4 種の入力モード：`dish_photo` / `nutrition_label` / `text_ai` / `text_manual`
- 記録作成、日付別一覧、アレルゲンとメモの編集、削除
- 画像アップロード、ローカル保存、`/uploads/*` 配信
- Claude API 連携と `CLAUDE_MOCK` によるモック分析
- カロリー統計、PFC 比率の分析画面
- Docker Compose による開発 DB と本番構成
- backend 起動時の `sqlx::migrate!` 自動 migration

### 未実装・将来候補

- 認証、マルチユーザー対応
- 全フィールド編集（料理名、食材、カロリー、PFC）
- アレルゲン統計エンドポイント
- 検索、アレルゲンフィルター、ユーザー登録アレルゲンとの突合せ
- 自動バックアップ cron
- MCP / Claude Skills / Agent SDK の本体統合

## アーキテクチャ

```
React + TypeScript + Vite (:5173)
        |
        | HTTP/JSON, multipart/form-data
        v
Rust + Axum (:8000)
        |-- sqlx --> PostgreSQL
        |-- reqwest --> Anthropic Claude API
        `-- fs --> UPLOAD_DIR
```

### 主なディレクトリ

```
backend/src/
├── main.rs              ルーター、CORS、body limit、static file 配信
├── config.rs            DATABASE_URL, CLAUDE_API_KEY, UPLOAD_DIR, PORT など
├── handlers/
│   ├── records.rs       /api/records
│   └── stats.rs         /api/stats
├── services/
│   ├── ai.rs            Claude API 呼び出し、モデル分岐、JSON parse
│   └── storage.rs       画像保存、リサイズ、削除
└── models/record.rs     FoodRecord, UpdateRecordRequest

frontend/src/
├── App.tsx              / と /analytics のルーティング
├── api/records.ts       API クライアント
├── pages/
│   ├── Dashboard.tsx    記録作成・日付別一覧
│   └── Analytics.tsx    分析画面
├── components/          入力、一覧、詳細、グラフ、編集 UI
└── types/index.ts       API 型
```

## データベース

Migration は `migrations/` にあり、backend 起動時に `sqlx::migrate!` で自動適用されます。

| Migration | 内容 |
|-----------|------|
| `001_initial.sql` | `users`、`food_records`、`allergen_names` 作成。`users(id=1)` を投入 |
| `002_add_entry_mode.sql` | `food_records.entry_mode VARCHAR(20) NOT NULL DEFAULT 'dish_photo'` を追加 |
| `003_change_decimal_to_float.sql` | 栄養数値カラムを `DOUBLE PRECISION` に変更 |

### 現行スキーマ要点

```sql
CREATE TABLE food_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_mode VARCHAR(20) NOT NULL DEFAULT 'dish_photo',
    image_path VARCHAR(1024),
    calories_kcal DOUBLE PRECISION,
    protein_g DOUBLE PRECISION,
    fat_g DOUBLE PRECISION,
    carbs_g DOUBLE PRECISION,
    components JSONB,
    allergens JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`components` の想定形：

```json
{
  "dish_name": "目玉焼き定食",
  "main_ingredients": ["卵", "ご飯", "みそ汁"]
}
```

`allergens` は JSON 配列です。

```json
["卵", "小麦"]
```

## API

基本 URL は `http://localhost:8000/api` です。

### POST /api/records

記録を作成します。リクエストは `multipart/form-data` です。

| フィールド | 対象モード | 説明 |
|-----------|------------|------|
| `entry_mode` | 全モード | `dish_photo` / `nutrition_label` / `text_ai` / `text_manual`。省略時 `dish_photo` |
| `image` | `dish_photo`, `nutrition_label` | JPG/PNG、最大 10MB |
| `text_description` | `text_ai`, `text_manual` | 料理名・説明 |
| `dish_name` | `text_manual` | 手動入力の料理名。なければ `text_description` を使う |
| `calories_kcal` | `text_manual` | 手動入力カロリー |
| `protein_g` / `fat_g` / `carbs_g` | `text_manual` | 手動入力 PFC |
| `allergens` | `text_manual` | JSON 配列文字列 |

各モードの処理：

| モード | 画像 | Claude | 保存される主な値 |
|--------|------|--------|------------------|
| `dish_photo` | 必須 | 画像から推定 | 画像パス、栄養値、components、allergens |
| `nutrition_label` | 必須 | ラベル記載値を読み取り | 画像パス、栄養値、components、allergens |
| `text_ai` | 不要 | テキストから推定 | 栄養値、components、allergens |
| `text_manual` | 不要 | なし | 手動入力値 |

AI 分析が失敗した場合でも record は作成され、栄養値・components・allergens は `null` になります。

### GET /api/records

記録一覧を返します。

クエリ：

| 名前 | 説明 |
|------|------|
| `date` | `YYYY-MM-DD`。指定日の記録だけを返す |
| `limit` | 1〜200。省略時 50 |
| `offset` | 0 以上。省略時 0 |

レスポンス：

```json
{
  "data": [],
  "total_calories": 0.0
}
```

`total_calories` は返却された record の `calories_kcal` 合計です。

### PUT /api/records/:id

現スコープではアレルゲンとメモだけ更新できます。

```json
{
  "allergens": ["卵", "小麦"],
  "notes": "量を少なめに修正"
}
```

対象 record がない場合は 404 です。

### DELETE /api/records/:id

record を削除します。`image_path` があれば `UPLOAD_DIR` 配下のファイル削除も試行します。ファイルが存在しない場合は削除不要として扱います。

### GET /api/stats/calories

カロリー統計を返します。

| クエリ | 説明 |
|--------|------|
| `period=week` | 直近 7 日。省略時も week 扱い |
| `period=month` | 直近 30 日 |

```json
{
  "period": "week",
  "data": [{ "date": "2026-06-05", "calories": 1800.0 }],
  "average_calories": 1800.0
}
```

### GET /api/stats/nutrients

指定日の PFC 合計とカロリー比率を返します。

| クエリ | 説明 |
|--------|------|
| `date` | `YYYY-MM-DD`。省略時は backend 実行環境のローカル日付 |

```json
{
  "date": "2026-06-05",
  "protein_g": 45.0,
  "fat_g": 60.5,
  "carbs_g": 220.0,
  "total_calories": 1450.5,
  "ratio": {
    "protein_percent": 12.4,
    "fat_percent": 37.5,
    "carbs_percent": 60.1
  }
}
```

## 画像保存

`UPLOAD_DIR` は保存ベースディレクトリです。DB には `uploads/YYYYMMDD/user_1_YYYYMMDD_HHMMSS_xxxxxxxx.jpg` のような相対パスだけを保存します。

実装仕様：

- 入力ファイルは handler で 10MB 超を拒否
- Axum body limit は multipart overhead を見込んで 11MB
- 本番 nginx は `client_max_body_size 12m`
- 5MB 超の画像は `image` crate で長辺 2000px 以内、JPEG 品質 85 にリサイズ
- リサイズ後の画像を保存し、その base64 を Claude API に送る
- `DELETE` 時は canonicalize で `UPLOAD_DIR` 外に出ないことを検証してから削除

## Claude API

実装正本は `backend/src/services/ai.rs` です。

| 定数 | モデル | 用途 |
|------|--------|------|
| `MODEL_DEFAULT` | `claude-3-5-sonnet-20241022` | `dish_photo`、`text_ai` |
| `MODEL_LABEL` | `claude-haiku-4-5-20251001` | `nutrition_label` |

`CLAUDE_MOCK` が設定されている場合は API を呼ばず、固定 JSON を返します。実 API 呼び出しでは Anthropic Messages API を `reqwest` で直接呼びます。

期待する JSON 形：

```json
{
  "dish_name": "料理名",
  "main_ingredients": ["食材1", "食材2"],
  "calories_kcal": 450.0,
  "protein_g": 18.0,
  "fat_g": 12.0,
  "carbs_g": 65.0,
  "allergens": ["卵"]
}
```

レスポンス本文から最初の JSON オブジェクトを切り出し、`AnalysisResult` に deserialize します。HTTP 失敗や parse 失敗は `AppError::Claude` になり、handler 側で警告ログを出して record 作成を継続します。

## フロントエンド

画面：

- `/` — `Dashboard`
  - `EntryModeSelector`
  - `ImageUpload`
  - `TextEntryForm`
  - `RecordList` / `RecordDetail`
  - `AllergenEditor`
- `/analytics` — `Analytics`
  - `CalorieChart`
  - `NutrientChart`

API 呼び出しは `frontend/src/api/records.ts` に集約しています。`VITE_API_BASE_URL` が未設定の場合は `http://localhost:8000` を使います。

## 開発セットアップ

### Dev Container 推奨手順

1. ホスト側で PostgreSQL を起動

```bash
docker compose up -d postgres
```

2. `backend/.env` を作成

```bash
cp backend/.env.example backend/.env
```

Dev Container 内から接続する場合：

```env
DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/taberu_db
CLAUDE_API_KEY=sk-ant-xxxx
UPLOAD_DIR=./uploads
RUST_LOG=debug
CLAUDE_MOCK=1
CORS_ORIGIN=http://localhost:5173
```

3. backend を起動

```bash
cd backend
cargo run
```

4. frontend を起動

```bash
cd frontend
npm install
npm run dev
```

Migration は backend 起動時に自動適用されるため、通常は `psql < migrations/*.sql` を手動実行しません。

### Dev Container を使わない場合

ホスト OS に Rust と Node.js を入れ、`DATABASE_URL` のホスト名を `localhost` にします。

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/taberu_db
```

## 本番デプロイ

`docker-compose.prod.yml` で PostgreSQL、backend、frontend/nginx を起動します。

```bash
cp .env.example .env
# POSTGRES_PASSWORD と CLAUDE_API_KEY を設定
docker compose -f docker-compose.prod.yml up -d --build
```

起動時の流れ：

1. PostgreSQL 起動と healthcheck
2. backend イメージ build
3. backend 起動時に `sqlx::migrate!` が migration を適用
4. frontend nginx 起動

### sqlx query cache

`sqlx::query!` / `query_as!` を追加・変更した場合だけ、オフラインビルド用キャッシュを更新します。

```bash
docker compose run --rm sqlx-prepare
git add backend/.sqlx
git commit -m "chore: update sqlx query cache"
```

## 学習・実験トラック

MCP、Claude Skills、Agent SDK は学習候補ですが、現時点では本体未統合です。試す場合は、動作中のアプリ機能を壊さない単位で個別タスク化し、結果を [docs/learning-log.md](learning-log.md) に短く残します。

候補：

- `allergen-dictionary` MCP
- `nutrition-db` MCP
- `food-image-analyzer` Skill
- `nutrition-validator` Skill
- 期間分析コメント生成

## 変更履歴メモ

- 2026-06-05：コード実態に合わせて詳細仕様を再整理。AI モデル分岐、migration 自動適用、実装済み/未実装の境界を更新。
- 2026-06-05：`nutrition_label` を Haiku へ切替。
- 2026-06-02：画像サイズ上限を frontend/nginx/Axum/handler で整理。
- 2026-05-16：`entry_mode` 4 種を追加。
