# Taberu

食事を記録し、Claude API で栄養分析する個人向け Web アプリです。料理写真、栄養成分表示ラベル、テキスト、手動入力の 4 モードで記録できます。

詳細仕様は [docs/design.md](docs/design.md)、エージェント向け運用ルールは [CLAUDE.md](CLAUDE.md) を参照してください。実装コードと migration が最上位の正本です。

## 機能

- 4 種の記録モード
  - `dish_photo` — 料理写真から Claude が栄養を推定
  - `nutrition_label` — 栄養成分表示ラベル写真から Claude が記載値を読み取り
  - `text_ai` — 料理名・説明テキストから Claude が栄養を推定
  - `text_manual` — 料理名、カロリー、PFC、アレルゲンを手動入力
- 日付別の記録一覧、合計カロリー表示
- アレルゲンとメモの編集、記録削除
- カロリー推移と PFC 比率の分析画面
- アップロード画像のローカル保存と配信

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite + Recharts |
| バックエンド | Rust + Axum + sqlx |
| データベース | PostgreSQL 16 |
| AI 分析 | Anthropic Claude API |
| コンテナ | Docker Compose |

## クイックスタート

### 前提条件

- Docker Desktop または Docker Engine + Compose
- VS Code + Dev Containers 拡張機能（推奨）

### 1. PostgreSQL を起動

ホスト側ターミナルで実行します。

```bash
docker compose up -d postgres
```

migration は backend 起動時に `sqlx::migrate!` で自動適用されます。

### 2. バックエンド環境変数を設定

```bash
cp backend/.env.example backend/.env
```

Dev Container 内からホスト側 Postgres に接続する場合の例：

```env
DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/taberu_db
CLAUDE_API_KEY=sk-ant-xxxx
UPLOAD_DIR=./uploads
RUST_LOG=debug
CLAUDE_MOCK=1
CORS_ORIGIN=http://localhost:5173
```

`CLAUDE_MOCK=1` を設定すると Claude API を呼ばず、固定のモック分析結果を返します。実 API を使う場合は `CLAUDE_API_KEY` を設定し、`CLAUDE_MOCK` を外してください。

Linux ホストで `host.docker.internal` が解決できない場合は、`.devcontainer/devcontainer.json` に `--add-host=host.docker.internal:host-gateway` を追加して Dev Container を再ビルドします。`.devcontainer/` はユーザー管理領域です。

### 3. バックエンドを起動

```bash
cd backend
cargo run
```

起動確認：

```bash
curl http://localhost:8000/api/records
# {"data":[],"total_calories":0.0}
```

### 4. フロントエンドを起動

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。API ベース URL は `frontend/src/api/records.ts` で `VITE_API_BASE_URL`、未設定時 `http://localhost:8000` です。

## API 概要

| メソッド | パス | 説明 |
|--------|------|------|
| `POST` | `/api/records` | 食事記録を作成。`multipart/form-data` |
| `GET` | `/api/records` | 記録一覧。`date=YYYY-MM-DD`、`limit`、`offset` に対応 |
| `PUT` | `/api/records/:id` | アレルゲンとメモを更新 |
| `DELETE` | `/api/records/:id` | 記録を削除。画像があれば物理削除も試行 |
| `GET` | `/api/stats/calories` | カロリー統計。`period=week\|month` |
| `GET` | `/api/stats/nutrients` | PFC 内訳。`date=YYYY-MM-DD` |
| `GET` | `/api/stats/allergens` | アレルゲン集計。`period=week\|month`。ランキングと日別出現を返す |
| `GET` | `/uploads/*` | アップロード画像を配信 |

### POST /api/records の主なフィールド

| フィールド | 対象モード | 説明 |
|-----------|------------|------|
| `entry_mode` | 全モード | `dish_photo` / `nutrition_label` / `text_ai` / `text_manual`。省略時は `dish_photo` |
| `image` | `dish_photo`, `nutrition_label` | JPG/PNG、最大 10MB |
| `text_description` | `text_ai`, `text_manual` | 料理名・説明 |
| `dish_name` | `text_manual` | 手動入力の料理名 |
| `calories_kcal` | `text_manual` | 手動入力カロリー |
| `protein_g` / `fat_g` / `carbs_g` | `text_manual` | 手動入力 PFC |
| `allergens` | `text_manual` | JSON 配列文字列 |

画像アップロードは frontend の `react-dropzone`、nginx `client_max_body_size 12m`、Axum `DefaultBodyLimit::max(11MB)`、handler の 10MB チェックで制限します。5MB 超の画像は `backend/src/services/storage.rs` で長辺 2000px 以内にリサイズされ、保存と Claude 送信に使われます。

## AI モデル

モデル定数の実装正本は `backend/src/services/ai.rs` です。

| モード | 入力 | モデル |
|--------|------|--------|
| `dish_photo` | 画像 | `claude-3-5-sonnet-20241022` |
| `nutrition_label` | 画像 | `claude-haiku-4-5-20251001` |
| `text_ai` | テキスト | `claude-3-5-sonnet-20241022` |
| `text_manual` | なし | API 呼び出しなし |

AI 分析に失敗した場合も record は作成され、栄養値・components・allergens は `null` で保存されます。

## データベース

`migrations/` の現行順序：

1. `001_initial.sql` — `users`、`food_records`、`allergen_names`
2. `002_add_entry_mode.sql` — `food_records.entry_mode`
3. `003_change_decimal_to_float.sql` — 栄養数値カラムを `DOUBLE PRECISION` に変更

現スコープはシングルユーザー運用で、API は `user_id = 1` 固定です。

## 本番デプロイ

ホストに必要なのは Docker のみです。

```bash
cp .env.example .env
# .env の POSTGRES_PASSWORD と CLAUDE_API_KEY を実値に変更
docker compose -f docker-compose.prod.yml up -d --build
```

更新時：

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

backend 起動時に `sqlx::migrate!` が migration を自動適用します。

### sqlx クエリキャッシュ

`backend/src/**/*.rs` の `sqlx::query!` / `query_as!` を追加・変更した場合だけ、オフラインビルド用キャッシュを再生成してコミットします。

```bash
docker compose run --rm sqlx-prepare
git add backend/.sqlx
git commit -m "chore: update sqlx query cache"
```

`.sqlx/` には SQL とスキーマ型情報のみが含まれ、接続情報・実データ・シークレットは含まれません。
