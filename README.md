# Taberu

食事写真を記録・栄養分析する個人向け Web アプリ。Claude Vision API が料理写真を自動分析し、カロリー・PFC・アレルゲンを抽出します。

## 機能

- 4 種の記録モード
  - `dish_photo` — 料理写真 → Claude が栄養を推定
  - `nutrition_label` — 栄養成分表示ラベル写真 → 記載値をそのまま読み取り
  - `text_ai` — 料理名テキスト → Claude が栄養を推定
  - `text_manual` — カロリー・PFC を手動入力
- カロリー推移・PFC 比率グラフ（日別 / 週別 / 月別）
- アレルゲン管理・警告表示

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite + Recharts |
| バックエンド | Rust (Axum) + sqlx |
| データベース | PostgreSQL 16 |
| AI 分析 | Claude API (Anthropic) |
| コンテナ | Docker Compose |

## クイックスタート

### 前提条件

- Docker Desktop（または Docker Engine + Compose）
- VS Code + Dev Containers 拡張機能（推奨）

### 1. PostgreSQL を起動（ホスト側ターミナル）

```bash
docker compose up -d postgres
```

マイグレーションは backend 起動時（次節の `cargo run` 時）に自動適用される。

### 2. 環境変数を設定

```bash
cp backend/.env.example backend/.env
```

`backend/.env` を編集：

```env
# Dev Container 内から実行する場合
DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/taberu_db

CLAUDE_API_KEY=sk-ant-xxxx   # Anthropic API キー
UPLOAD_DIR=./uploads
RUST_LOG=debug
CLAUDE_MOCK=1                 # API キーなしで動作確認する場合は 1
CORS_ORIGIN=http://localhost:5173
```

> **Linux ホストの場合**：`host.docker.internal` が解決されない場合があります。`.devcontainer/devcontainer.json` の `runArgs` に `"--add-host=host.docker.internal:host-gateway"` を追加してから Dev Container を再ビルドしてください。

### 3. バックエンドを起動（Dev Container 内）

```bash
cd backend
cargo run
# http://localhost:8000 で起動
```

動作確認：

```bash
curl http://localhost:8000/api/records
# {"data":[],"total_calories":0.0}
```

### 4. フロントエンドを起動（Dev Container 内・別ターミナル）

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 で起動
```

## API

| メソッド | パス | 説明 |
|--------|------|------|
| `POST` | `/api/records` | 食事記録を作成（multipart/form-data） |
| `GET` | `/api/records` | 記録一覧（`?date=YYYY-MM-DD` で日付絞り込み） |
| `PUT` | `/api/records/:id` | アレルゲン・メモを更新 |
| `DELETE` | `/api/records/:id` | 記録を削除 |
| `GET` | `/api/stats/calories` | カロリー統計（`?period=week\|month`） |
| `GET` | `/api/stats/nutrients` | PFC 内訳（`?date=YYYY-MM-DD`） |
| `GET` | `/uploads/*` | アップロード画像の配信 |

詳細な仕様は [`docs/design.md`](docs/design.md) を参照してください。

## 本番デプロイ

ホストに必要なのは Docker のみ（Rust / cargo / Node は不要）。

```bash
# 1. .env を作成（POSTGRES_PASSWORD と CLAUDE_API_KEY を実値に書き換える）
cp .env.example .env

# 2. 起動（イメージビルド・DB マイグレーション適用すべて自動）
docker compose -f docker-compose.prod.yml up -d --build
```

これだけ。更新時も `git pull && docker compose -f docker-compose.prod.yml up -d --build` だけで済む。
マイグレーションは backend 起動時に `sqlx::migrate!` で自動適用される。

### クエリを書き換えたとき（開発者向け）

`backend/src/**/*.rs` 内の `sqlx::query!` / `query_as!` を追加・変更した場合のみ、
オフラインビルド用のクエリキャッシュを再生成してコミットする。

```bash
docker compose run --rm sqlx-prepare
git add backend/.sqlx
git commit -m "chore: update sqlx query cache"
```

> ⚠️ 再生成忘れに注意。古い `.sqlx/` のままだとビルドは通るが、実 DB スキーマと
> 乖離した型で動作する可能性がある。`.sqlx/` には SQL とスキーマ型情報のみで
> シークレットや実データは含まれないので、公開リポジトリでもコミットして問題ない。

詳細手順・バックアップ・トラブルシュートは [`docs/design.md`](docs/design.md) の
「デプロイメント戦略」セクションを参照。

