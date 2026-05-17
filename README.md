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
docker compose exec -T postgres psql -U postgres -d taberu_db < migrations/001_initial.sql
docker compose exec -T postgres psql -U postgres -d taberu_db < migrations/002_add_entry_mode.sql
docker compose exec -T postgres psql -U postgres -d taberu_db < migrations/003_change_decimal_to_float.sql
```

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

`docker-compose.prod.yml` で全サービスをまとめて起動します。

```bash
# ルートに .env を作成
echo "POSTGRES_PASSWORD=強いパスワード" > .env
echo "CLAUDE_API_KEY=sk-ant-xxxx" >> .env

# sqlx クエリキャッシュを事前生成（初回のみ）
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/taberu_db cargo sqlx prepare
cd ..
git add backend/.sqlx && git commit -m "chore: update sqlx query cache"

# ビルド & 起動
docker compose -f docker-compose.prod.yml up -d --build
```

詳細手順は [`docs/design.md`](docs/design.md) の「デプロイメント戦略」セクションを参照。

## ライセンス

MIT
