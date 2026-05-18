# Taberu - 食べ物記録アプリケーション

## プロジェクト概要

ユーザーが毎日食べたもの（写真）を時系列で記録する日記型アプリケーション。

**主な特徴**：
- 📸 **写真ベースの記録**：いつでも食べたものを撮影・記録可能
- 🤖 **AI自動分析**：Claude APIが写真から栄養情報（カロリー、主成分、アレルギー情報）を自動抽出
- 🧩 **最新AI技術の取り込み**：MCP（Model Context Protocol）サーバーやClaude Skillsを画像分析パイプラインに組み込み、外部知識（栄養データベース・アレルゲン辞書など）と連携した精度向上を狙う
- 📊 **グラフダッシュボード**：カロリー推移、栄養素構成、アレルギー警告を可視化
- 🏠 **自宅サーバー対応**：低コスト、シンプルなローカルディスク保存

**プロジェクトの背景**：
ユーザーが日々の食生活を記録し、栄養管理やアレルギー対応をサポートするツール。**開発速度を最優先**としつつ、副次的な目的として **コード（Rust / React・TypeScript）の学習** と **MCP・Claude Skills など最新のAI技術の実践的キャッチアップ** も兼ねる。シングルユーザーから始めて段階的にマルチユーザー対応へ拡張可能な設計。

**動機の優先順位**（迷ったときの判断軸）：
1. 動くプロダクトを最短で完成させる（記録UXが先、最適化は後）
2. 触ったことのない領域（Rust / Axum / MCP / Skills）は「読める・直せる」レベルの理解を残す
3. 「便利そうな抽象化」より「素直で読みやすい実装」を優先（学習用途のため、隠蔽しすぎない）

---

## 技術スタック

| レイヤー | 技術選択 | 理由 |
|---------|---------|------|
| **フロントエンド** | React + TypeScript | 参考資料が豊富、開発速度が速い |
| **バックエンド** | Rust（Axum） | 高性能、メモリ安全、軽量、自宅サーバー環境最適 |
| **データベース** | PostgreSQL 14+ | 信頼性、JSONB 型による柔軟なデータ管理 |
| **AI分析** | Claude API（Anthropic） | 開発速度重視、栄養・アレルギー情報の精度が高い |
| **ファイル保存** | ローカルディスク（`/var/lib/taberu/uploads/`） | 低コスト、シンプル、自宅サーバーに最適 |
| **グラフ表示** | Recharts（React） | 統合が簡単、自宅サーバー環境に適応 |
| **ビルド** | Vite（フロントエンド） | 高速、開発体験が良い |

---

## 機能要件

### Phase 1：記録機能UX最優先（2-3週間）

**Tier 1: 最優先機能**

1. **シングルユーザー対応**（認証なし）
   - 固定ユーザーID = 1 で運用
   - 設計：将来的にマルチユーザー対応可能（user_id 外部キーは保持）

2. **食べ物記録**（3つの入力モード）

   | モード | 概要 |
   |--------|------|
   | `dish_photo` | 料理写真を撮影 → Claude が栄養情報を **推定** |
   | `nutrition_label` | 食品パッケージの栄養成分表示ラベルを撮影 → Claude が **記載値をそのまま読み取り** |
   | `text_ai` | 料理名・説明をテキスト入力 → Claude が栄養情報を **推定** |
   | `text_manual` | 料理名・栄養値をすべて **手動入力**（AI不使用） |

   - 📸 写真アップロード（ドラッグ&ドロップ対応）— `dish_photo` / `nutrition_label` モード
   - 📦 栄養ラベル読み取り：パッケージ裏面の数値を正確に抽出（推定値ではなく記載値）
   - ⌨️ テキスト入力：写真なしで記録可能（AI推定 or 手動入力を選択）
   - 🤖 Claude API によるリアルタイム分析
     - 自動抽出：カロリー（kcal）、タンパク質（g）、脂肪（g）、炭水化物（g）
     - 主な成分・食材リスト
     - 含まれるアレルゲン（特定原材料・推奨表示）
   - ✏️ テキスト編集：AI結果の修正・確認
   - ⏰ 投稿日時：アップロード時刻を自動記録

3. **記録閲覧・管理**
   - 📋 日別詳細ビュー（時系列表示）
   - 🔍 検索・フィルター
     - 日付指定検索
     - アレルギーフィルター（登録アレルゲンを含む食べ物のハイライト）
   - 🗑️ 記録削除・編集
     - 現在スコープ：アレルゲンの追加・削除
     - 将来スコープ：全フィールド（料理名・食材・カロリー・PFC・メモ）の編集

**Tier 2: 統計・グラフ機能（Phase 1 後期 ~ Phase 2 初期）**

4. **分析ダッシュボード**
   - 📈 **カロリー推移グラフ**
     - 日別カロリー推移（折れ線グラフ）
     - 週別・月別平均カロリー（棒グラフ）
   - 🥗 **栄養素構成グラフ**
     - PFC（タンパク質・脂肪・炭水化物）の割合（円グラフ）
     - 日別栄養素推移（積み重ねグラフ）
   - ⚠️ **アレルギー警告ダッシュボード**
     - 登録アレルゲンを含む食べ物の履歴表示
     - 警告バッジ付きで視認性向上
   - 📊 栄養統計サマリー（週単位の平均カロリー、主要栄養素）

### Phase 2 以降（スコープ外）
- ユーザー認証機能（メール・パスワード登録）
- マルチユーザー対応
- SNS共有機能
- AIモデル自作

### 学習・実験トラック（並走するサブゴール）

機能要件とは別に、本プロジェクトでは以下を「学びのために積極的に試す」対象とする。MVP（Phase 1）の完成を遅らせない範囲で導入すること。

- 🧩 **MCPサーバーの自作・接続**：栄養データベース／アレルゲン辞書／自分の食事履歴を提供するMCPを段階的に追加
- 🪄 **Claude Skillsの活用**：画像分析プロンプト・JSONスキーマ・後処理をSkill化し再利用可能にする
- 🦀 **Rust（Axum / sqlx）の習得**：型システム・所有権・`Result` ベースのエラーハンドリングを実コードで体得
- ⚛️ **React + TypeScriptの実践**：Hooks／状態管理／Recharts での可視化を、説明できるレベルまで理解
- 🤖 **Claude Agent SDK の試用**：バックエンドからエージェント的にClaudeを呼び出すパターンを評価（Phase 2 候補）

---

## システムアーキテクチャ

### 全体図

```
┌─────────────────────────────────────┐
│  React + TypeScript                 │
│  (http://localhost:3000)            │
├─────────────────────────────────────┤
│ Pages:                              │
│  - Dashboard（日別記録表示）         │
│  - DailyDetail（詳細ビュー）        │
│  - AnalyticsDashboard（グラフ表示）  │
│                                     │
│ Components:                         │
│  - ImageUpload（ドラッグ&ドロップ）  │
│  - RecordDetail（記録表示）         │
│  - CalorieChart / NutrientChart     │
│  - AllergenWarning                  │
└─────────────────────────────────────┘
           ↕️ HTTP/JSON
┌─────────────────────────────────────┐
│  Rust + Axum                        │
│  (http://localhost:8000)            │
├─────────────────────────────────────┤
│ API Endpoints:                      │
│  POST   /api/records                │
│    → 画像アップロード + AI分析      │
│  GET    /api/records                │
│    → 日付指定で記録取得             │
│  PUT    /api/records/{id}           │
│    → 記録編集                       │
│  DELETE /api/records/{id}           │
│    → 記録削除                       │
│  GET    /api/stats/calories         │
│    → カロリー統計                   │
│  GET    /api/stats/nutrients        │
│    → 栄養素統計                     │
│  GET    /api/stats/allergens        │
│    → アレルギー情報統計             │
│                                     │
│ Services:                           │
│  - ai.rs（Claude API連携）          │
│  - storage.rs（ファイル管理）       │
│  - stats.rs（統計計算）             │
│  - db.rs（DB操作）                  │
└─────────────────────────────────────┘
           ↕️ SQL
┌─────────────────────────────────────┐
│  PostgreSQL 14+                     │
│  (taberu_db)                        │
├─────────────────────────────────────┤
│ Tables:                             │
│  - users（シングルユーザー：id=1）  │
│  - food_records（記録）             │
│  - allergen_names（アレルゲン辞書） │
└─────────────────────────────────────┘

External:
┌─────────────────────────────────────┐
│  Claude API (Anthropic)             │
│  → 画像分析・栄養情報抽出           │
└─────────────────────────────────────┘

File Storage:
┌─────────────────────────────────────┐
│  /var/lib/taberu/uploads/           │
│  → ローカルディスク（画像保存）     │
└─────────────────────────────────────┘
```

---

## データベーススキーマ

### テーブル定義

#### users テーブル
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    allergies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**現状**：固定ユーザー（id=1）で運用  
**将来対応**：多数のユーザー行を追加可能

#### food_records テーブル
```sql
CREATE TABLE food_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_mode VARCHAR(20) NOT NULL DEFAULT 'dish_photo',
    -- 'dish_photo'     : 料理写真 → Claude推定
    -- 'nutrition_label': 成分表示ラベル → Claude記載値読み取り
    -- 'text_ai'        : テキスト入力 → Claude推定
    -- 'text_manual'    : テキスト入力 → 手動入力
    image_path VARCHAR(1024),  -- 相対パス例：uploads/20250514/user_1_20250514_120000_abc123.jpg（text系モードでは NULL）
    calories_kcal DECIMAL(7, 2),
    protein_g DECIMAL(6, 2),
    fat_g DECIMAL(6, 2),
    carbs_g DECIMAL(6, 2),
    components JSONB,  -- 主な食材リスト
    allergens JSONB DEFAULT '[]'::jsonb,  -- 含まれるアレルゲン
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_records_user_id ON food_records(user_id);
CREATE INDEX idx_food_records_created_at ON food_records(created_at DESC);
```

**JSON フィールド例**：
```json
// components
{
  "main_ingredients": ["卵", "小麦", "砂糖"],
  "dish_name": "目玉焼き定食"
}

// allergens
["卵", "小麦"]
```

#### allergen_names テーブル
```sql
CREATE TABLE allergen_names (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50)  -- '特定原材料', '推奨表示'
);
```

---

## API仕様

### リクエスト/レスポンス形式

**基本URL**: `http://localhost:8000/api`

#### 記録作成：POST /api/records

**リクエスト**（multipart/form-data）：
```
- entry_mode: string（必須）— 'dish_photo' | 'nutrition_label' | 'text_ai' | 'text_manual'
- date: string（ISO 8601形式、例：2025-05-14）
- image: File（JPG/PNG、最大10MB）— dish_photo / nutrition_label モードのみ必須
- text_description: string — text_ai / text_manual モードで料理名・説明を渡す
- calories_kcal: number — text_manual モードのみ（手動入力値）
- protein_g: number    — text_manual モードのみ
- fat_g: number        — text_manual モードのみ
- carbs_g: number      — text_manual モードのみ
- dish_name: string    — text_manual モードのみ
- allergens: JSON配列  — text_manual モードのみ
```

**レスポンス**（201 Created）：
```json
{
  "id": 1,
  "entry_mode": "dish_photo",
  "image_path": "uploads/20250514/user_1_20250514_120000_abc123.jpg",
  "calories_kcal": 450.5,
  "protein_g": 15.2,
  "fat_g": 18.0,
  "carbs_g": 55.3,
  "components": {
    "main_ingredients": ["卵", "ご飯", "バター"],
    "dish_name": "目玉焼き定食"
  },
  "allergens": ["卵"],
  "created_at": "2025-05-14T12:00:00Z",
  "notes": ""
}
```

#### 記録取得：GET /api/records?date=2025-05-14

**レスポンス**：
```json
{
  "data": [
    {
      "id": 1,
      "image_path": "uploads/20250514/user_1_20250514_120000_abc123.jpg",
      "calories_kcal": 450.5,
      "allergens": ["卵"],
      "created_at": "2025-05-14T12:00:00Z"
    }
  ],
  "total_calories": 1200.0
}
```

#### 統計：GET /api/stats/calories?period=week

**レスポンス**：
```json
{
  "period": "week",
  "data": [
    { "date": "2025-05-08", "calories": 1850 },
    { "date": "2025-05-09", "calories": 2100 },
    ...
    { "date": "2025-05-14", "calories": 1950 }
  ],
  "average_calories": 1980
}
```

#### 栄養素統計：GET /api/stats/nutrients?date=2025-05-14

**レスポンス**：
```json
{
  "date": "2025-05-14",
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

#### 記録編集：PUT /api/records/{id}

**リクエスト**（現スコープ：アレルゲン追加/削除 + メモ）：
```json
{
  "allergens": ["卵", "小麦", "乳"],
  "notes": "修正：バターが多めだった"
}
```

> **将来スコープ**：`dish_name`, `main_ingredients`, `calories_kcal`, `protein_g`, `fat_g`, `carbs_g` も編集可能にする。

#### 記録削除：DELETE /api/records/{id}

**レスポンス**（204 No Content）

---

## ファイル保存戦略

### ディレクトリ構成

```
/var/lib/taberu/
├── uploads/
│   ├── 20250514/
│   │   ├── user_1_20250514_120000_abc123def.jpg
│   │   ├── user_1_20250514_140000_xyz789uvw.jpg
│   │   └── ...
│   ├── 20250515/
│   │   └── ...
│   └── ...
└── backups/
    ├── uploads_20250514.tar.gz
    ├── uploads_20250515.tar.gz
    └── ...
```

### 保存仕様

- **ファイル名フォーマット**：`user_{user_id}_{YYYYMMDD}_{HHMMSS}_{random_hash}.jpg`
- **相対パス保存**：DB には `uploads/20250514/user_1_...jpg` のみ保存
- **バージョン管理**：ファイル削除時は物理削除（ストレージ節約）
- **バックアップ**：毎日夜間 1:00 に `uploads/` をtarに圧縮してバックアップ

### 利点

- ✅ 低コスト（クラウドストレージ不要）
- ✅ シンプル（設定が少ない）
- ✅ 自己管理（データ所有権が完全）
- ✅ オフライン対応可能（ローカルで完結）

---

## AI分析仕様（Claude API）

### 分析プロンプト（モード別）

入力モードに応じてプロンプトを切り替える。出力JSONスキーマは統一。

#### dish_photo モード（料理写真 → 推定）

```
以下の食べ物の写真を分析して、JSON形式で情報を返してください。
値はすべて推定値です。

JSON形式：
{
  "dish_name": "目玉焼き定食",
  "main_ingredients": ["卵", "ご飯", "バター"],
  "calories_kcal": 450,
  "protein_g": 15,
  "fat_g": 18,
  "carbs_g": 55,
  "allergens": ["卵", "小麦"]
}

1. 料理名
2. 主な食材（3-5個）
3. 推定カロリー（kcal）
4. 推定栄養素（タンパク質g、脂肪g、炭水化物g）
5. 含まれるアレルゲン（特定原材料7品目 + 推奨表示20品目）
```

#### nutrition_label モード（成分表示ラベル → 記載値読み取り）

```
この画像は食品パッケージの栄養成分表示ラベルです。
印刷されている数値をそのまま読み取り、JSON形式で返してください。
推定ではなく記載値を使用してください。一食分（または100g）の値を優先。

JSON形式：
{
  "dish_name": "商品名",
  "main_ingredients": [],
  "calories_kcal": 180,
  "protein_g": 4.5,
  "fat_g": 2.0,
  "carbs_g": 35.0,
  "allergens": ["小麦", "乳"]
}

アレルゲンはラベルの「原材料名」または「アレルゲン表示」欄から読み取る。
読み取れないフィールドは null を返す。
```

#### text_ai モード（テキスト入力 → 推定）

```
以下の料理名・説明から栄養情報を推定して、JSON形式で返してください。

入力：{text_description}

JSON形式：
{
  "dish_name": "ざるそば",
  "main_ingredients": ["そば", "だし", "ねぎ"],
  "calories_kcal": 290,
  "protein_g": 12,
  "fat_g": 2,
  "carbs_g": 58,
  "allergens": ["小麦", "そば"]
}

1. 料理名（入力から判断）
2. 主な食材（推定）
3. 推定カロリー・栄養素
4. 含まれるアレルゲン（特定原材料7品目 + 推奨表示20品目）
```

### API呼び出し

**Model**: `claude-3-5-sonnet-20241022`（最新版）  
**Vision対応**：YES（base64画像をサポート）  
**レート制限**：Claude API の公式レート制限に従う

### 段階的な精度向上方針（学習トラックと連動）

画像分析は「素のClaude Vision呼び出し」から始め、以下のように段階的に拡張する。各段階で動くものを残しながら学習を進める方針。

1. **Step 1：素のVision呼び出し**（Phase 1 前半）
   - 上記プロンプトをClaude API（Vision対応モデル）に直接送り、JSONで結果を受け取る
   - まずは「写真 → 栄養JSON」の最短経路を完成させる
2. **Step 2：Skill化**（Phase 1 後半）
   - 分析プロンプト・出力JSONスキーマ・バリデーションを **Claude Skill** としてパッケージ化（例：`food-image-analyzer`）
   - 同じSkillをバックエンドからのバッチ再分析や、開発時のClaude Code経由デバッグから再利用できるようにする
3. **Step 3：MCPで外部知識を注入**（Phase 2 初期）
   - 食品成分DB／アレルゲン辞書／自分の過去記録を **MCPサーバー** として用意し、分析時にClaudeから参照させる
   - 例：「卵」と検出 → 栄養DB MCPで卵Mサイズの実測値を引いてカロリー補正、アレルゲン辞書MCPで `卵` を特定原材料として確定
4. **Step 4：エージェント的なフロー**（Phase 2 後期・実験）
   - 複数枚同時アップロード時に、Claude Agent SDK のサブエージェントを用いて並列に画像分析させる構成を試す

---

## MCP & Claude Skills 活用方針（画像分析を中心に）

> 本プロジェクトの **学習トラック** の中心。MVPの完成を遅らせない範囲で、画像分析パイプラインに段階的に組み込む。
> 本セクションは **「やりたいこと」のカタログ** であり、実装順は機能要件と相談しながら決める。

### なぜMCP / Skillsを使うか

- **MCP（Model Context Protocol）**：Claudeに「外部の知識・データソース」を統一インタフェースで接続する仕組み。Vision分析の弱点（料理名から栄養への変換が曖昧／日本の食材に弱い／ユーザー固有のアレルゲンを知らない）を、外部DBや辞書で補える。
- **Claude Skills**：プロンプト・スキーマ・補助スクリプトを「再利用可能なパッケージ」として束ねる仕組み。同じ画像分析ロジックを、アプリ本体／開発時のClaude Code／将来のバッチ再分析で共通化できる。

### 画像分析パイプラインにおける統合イメージ

```
[写真アップロード]
      │
      ▼
[Skill: food-image-analyzer]  ← プロンプト + 出力JSONスキーマ + バリデーション
      │
      ├──► Claude Vision（画像 → 候補JSON）
      │
      ├──► MCP: nutrition-db        （食材ごとの正確なカロリー・PFC）
      ├──► MCP: allergen-dictionary （特定原材料7品目 / 推奨表示21品目）
      └──► MCP: user-history        （過去の自分の記録：類似料理参照）
            │
            ▼
[Skill: nutrition-validator]  ← Vision結果をDB値で補正、信頼度スコア付与
            │
            ▼
[Skill: allergen-checker]     ← ユーザー登録アレルゲンと突合せ・リスク判定
            │
            ▼
   最終JSON（DBへ保存）
```

### MCPサーバー候補（自作 or 既存活用）

| MCP名 | 役割 | 入力 → 出力 | 学習ポイント |
|-------|------|-------------|-------------|
| **nutrition-db** | 日本食品標準成分表（八訂）を提供 | 食材名 → 100gあたりカロリー・PFC | 公開データのスキーマ設計、MCPリソース／ツールの違い |
| **allergen-dictionary** | 特定原材料7品目＋推奨表示21品目を構造化 | 食材名 → 該当アレルゲン候補（同義語含む） | 辞書系MCPの基本パターン |
| **user-history** | 自分のfood_records DBを参照可能に | 期間・キーワード → 過去記録 | 自前DBをMCP化する経験／読み取り権限の設計 |
| **photo-metadata** | アップロード画像のEXIF（撮影時刻・GPS）を提供 | image_path → EXIF JSON | ファイルシステム系MCPの実装感覚 |
| **recipe-lookup**（実験） | 公開レシピAPIをラップし、料理名 → 標準的な食材構成を返す | 料理名 → 食材リスト・分量 | 外部API ラッパー型MCP の練習 |

### Claude Skills 候補

| Skill名 | 役割 | 内容 |
|---------|------|------|
| **food-image-analyzer** | 画像から栄養JSONへの一次抽出 | プロンプト本文 + 出力JSONスキーマ + 失敗時リトライ方針 |
| **nutrition-validator** | Vision結果を栄養DB値で補正 | `nutrition-db` MCPを呼び、推定値と実測値の差をスコア化 |
| **allergen-checker** | アレルゲン突合せ・警告生成 | ユーザー登録アレルゲン × `allergen-dictionary` MCP |
| **meal-pattern-analyzer** | 期間統計・傾向コメント生成 | 「今週はたんぱく質不足」などのナレーション（分析ダッシュボード向け） |
| **dish-name-normalizer** | 表記ゆれ吸収（例：「目玉焼き定食」「目玉焼きセット」を統一） | 検索・統計の精度を上げる前処理 |

### 開発側でのSkills活用（おまけ）

アプリ本体だけでなく、**開発時にClaude Code経由で使うSkill** も並行して整備する。学習効果が高く、本体機能ともコードを共有しやすい。

- 食材データ投入バッチ用のSkill（CSV → DB seed）
- ローカルで撮った画像で `food-image-analyzer` Skillを単体テストするSkill
- マイグレーション差分の説明生成Skill

### スコープ運用ルール

- ❗ **MVP（記録 → 表示）の完成が最優先**。Step 1（素のVision呼び出し）が動く前にMCP/Skill導入で詰まらないこと。
- ✅ MCP/Skillsの試作は、対応するアプリ機能が動いてから／別ブランチで行う。
- 📝 試した結果（うまくいった／いかなかった）は短くメモして残す（学習ログとしての価値が高い）。

---

## UI/UXフロー

### 画面遷移

```
ログイン（スキップ）
    ↓
Dashboard（日別記録一覧）
    ├→ [モード選択] 料理写真 / 栄養ラベル / テキスト入力
    │   ├→ 料理写真・栄養ラベル：ImageUpload（ドラッグ&ドロップ）
    │   │   └→ AI分析結果表示（確認 + アレルゲン編集可）
    │   │       └→ 記録保存
    │   │
    │   └→ テキスト入力：料理名を入力
    │       ├→ AI推定モード：Claude が栄養推定 → 確認 → 保存
    │       └→ 手動入力モード：全フィールドを自分で入力 → 保存
    │
    ├→ DailyDetail（日別詳細ビュー）
    │   ├→ 記録編集（現スコープ：アレルゲン追加/削除 + メモ）
    │   └→ 記録削除
    │
    └→ AnalyticsDashboard（グラフダッシュボード）
        ├→ カロリー推移グラフ（期間選択可）
        ├→ 栄養素構成グラフ
        └→ アレルギー警告ダッシュボード
```

### フロントエンドコンポーネント構成

```
App.tsx
├── Dashboard.tsx
│   ├── EntryModeSelector.tsx（モード選択タブ：料理写真 / 栄養ラベル / テキスト）
│   ├── ImageUpload.tsx（ドラッグ&ドロップ — dish_photo / nutrition_label）
│   ├── TextEntryForm.tsx（テキスト入力フォーム — text_ai / text_manual）
│   │   └── ManualNutritionForm.tsx（手動入力フィールド — text_manual）
│   ├── AnalysisResult.tsx（AI分析結果の確認・アレルゲン編集）
│   ├── RecordList.tsx（記録一覧）
│   │   └── RecordDetail.tsx（個別記録）
│   │       ├── NutritionInfo.tsx
│   │       ├── AllergenBadges.tsx
│   │       └── AllergenEditor.tsx（アレルゲン追加/削除 — 編集スコープ）
│   └── AllergyFilter.tsx
│
└── AnalyticsDashboard.tsx
    ├── CalorieChart.tsx（Recharts）
    ├── NutrientChart.tsx（Recharts）
    └── AllergenWarningBoard.tsx
```

---

## 開発セットアップ

### 環境要件

- **ホスト OS**: macOS / Linux（Windows WSL2）
- **ホストに必要なもの**:
  - Docker Desktop / Docker Engine + Docker Compose（**Postgres コンテナと Dev Container の両方をホスト側の Docker で起動する**）
  - VS Code + Dev Containers 拡張機能
  - Git
- **Dev Container 内で使うもの**（コンテナに含まれる / 後述の手順で入れる）:
  - Rust 1.70+（後述のステップ 2 で `rustup` 経由でインストール）
  - Node.js 18+（Dev Container イメージにプリインストール）

> **重要**：本リポジトリの `.devcontainer/` には Docker daemon 連携（docker-in-docker / docker-outside-of-docker）は組み込まれていません。そのため **Postgres コンテナはホスト OS 側の Docker で起動** し、Dev Container 内のアプリからは `host.docker.internal` 経由で接続します。`docker compose ...` 系のコマンドは **常にホスト側のターミナルで実行** してください。

### クイックスタート（Dev Container 環境）

#### ステップ 1：PostgreSQL の起動（ホスト側で実行）

Dev Container に入る前に、まずホスト OS のターミナルで Postgres コンテナを起動します。

```bash
# ホスト OS のシェルで実行
docker compose up -d postgres
```

起動確認（接続できれば OK）：

```bash
# ホスト OS のシェルで実行
docker compose exec postgres psql -U postgres -d taberu_db -c "\dt"
```

#### ステップ 2：Dev Container を開いて Rust をインストール

VS Code でリポジトリを開き、コマンドパレットから「Dev Containers: Reopen in Container」を実行します。

コンテナ内では Rust がプリインストールされていないため、最初に一度だけ実行します。

```bash
# Dev Container 内のシェルで実行
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

インストール確認：

```bash
# Dev Container 内のシェルで実行
rustc --version   # rustc 1.XX.X が表示されれば OK
cargo --version
node --version    # v18 以上
```

#### ステップ 3：環境変数ファイルの作成（Dev Container 内）

```bash
# Dev Container 内のシェルで実行
cp backend/.env.example backend/.env
```

`backend/.env` を編集して最低限以下を設定します。**`DATABASE_URL` のホスト名は `localhost` ではなく `host.docker.internal` を指定する** 点に注意してください（Dev Container 内からホスト側で動いている Postgres に接続するため）。

```env
DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/taberu_db
CLAUDE_API_KEY=sk-ant-xxxx   # Anthropic API キー（実機能を使う場合）
UPLOAD_DIR=./uploads          # ローカル開発用の相対パス
RUST_LOG=debug
CLAUDE_MOCK=1                 # Claude API を使わずモックで動かす場合は 1
```

> **CLAUDE_MOCK=1** を設定しておくと、Claude Vision API を呼ばずに固定のダミー JSON を返します。API キーがなくても開発を進められます。

> **Linux ホストの場合**：`host.docker.internal` がデフォルトでは解決されません。`.devcontainer/devcontainer.json` の `runArgs` に `"--add-host=host.docker.internal:host-gateway"` を追加してから Dev Container を再ビルドしてください（`.devcontainer/` 配下はユーザー管理領域なので、変更前に内容を確認のこと）。macOS / Windows の Docker Desktop では追加設定不要です。

フロントエンドの環境変数はすでに用意されています（`frontend/.env`）。

```env
VITE_API_BASE_URL=http://localhost:8000
```

> ブラウザは **ホスト側で動く** ため、`localhost:8000` はホストから見たバックエンドポートを指します。Dev Container 内の 8000 番ポートが VS Code によってホストにフォワードされていることを確認してください（VS Code の「ポート」タブで確認可能）。

#### ステップ 4：データベーススキーマの適用（ホスト側で実行）

マイグレーション SQL を直接適用します。`docker compose` を使うので **ホスト側のターミナル** で実行します。

```bash
# ホスト OS のシェルで実行
docker compose exec -T postgres psql -U postgres -d taberu_db < migrations/001_initial.sql
```

users テーブルのシードデータ（id=1 のユーザー）も同ファイルに含まれています。

#### ステップ 5：バックエンドのビルドと起動（Dev Container 内）

```bash
# Dev Container 内のシェルで実行
cd backend
cargo build          # 初回は依存クレートのダウンロードで数分かかります
cargo run            # http://localhost:8000 で起動
```

起動確認（Dev Container 内、またはホストのブラウザどちらからでも）：

```bash
curl http://localhost:8000/api/records
# {"data":[],"total_calories":0.0} が返れば OK
```

#### ステップ 6：フロントエンドの起動（Dev Container 内）

別ターミナル（Dev Container 内）で実行します。

```bash
# Dev Container 内のシェルで実行
cd frontend
npm install          # 初回のみ
npm run dev          # http://localhost:5173 で起動（Vite）
```

ホスト側のブラウザで `http://localhost:5173` を開くとダッシュボードが表示されます（5173 番ポートも VS Code 経由でホストにフォワードされます）。

---

### 全サービスの停止

```bash
# Dev Container 内：フロントエンド・バックエンドは Ctrl+C で停止
# PostgreSQL コンテナの停止（ホスト OS のシェルで実行）
docker compose down

# データも含めてリセットしたい場合（ホスト OS のシェルで実行）
docker compose down -v
```

---

### ローカル開発セットアップ（Dev Container を使わない場合）

ホスト OS に Rust / Node.js を直接入れて開発する場合の手順です。

**追加で必要なもの**：Rust（`rustup`）、Node.js 18+

クイックスタートとの差分は以下だけです：

- ステップ 2（Dev Container 起動 + Rust インストール）の代わりに、ホスト OS に `rustup` / Node.js を直接インストール
- ステップ 3 の `DATABASE_URL` のホスト名は `host.docker.internal` ではなく **`localhost`** を使う

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/taberu_db
```

ステップ 1・4 の `docker compose ...` コマンド、ステップ 5・6 の `cargo run` / `npm run dev` はそのままホスト OS で実行します。

---

### 環境変数リファレンス

**backend/.env**：
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/taberu_db
CLAUDE_API_KEY=sk-ant-xxxx
UPLOAD_DIR=./uploads
RUST_LOG=debug
CLAUDE_MOCK=1   # 1 でモック動作（開発時推奨）
```

**frontend/.env**：
```env
VITE_API_BASE_URL=http://localhost:8000
```

#### ストレージディレクトリ（本番環境）

本番サーバーでは以下のディレクトリを事前に作成します。開発時は `UPLOAD_DIR=./uploads` で自動作成されます。

```bash
mkdir -p /var/lib/taberu/uploads
mkdir -p /var/lib/taberu/backups
```

---

## 実装ステップ（段階的実装計画）

### Phase 1：記録機能コア実装（推定 2-3週間）

**Week 1-2: 基盤構築 + 記録アップロード**
1. Rust プロジェクト構造確立
2. PostgreSQL マイグレーション実行
3. 画像アップロード API 実装
4. Claude API 連携・AI分析実装
5. React UI：ImageUpload コンポーネント開発
6. フロント・バック統合テスト

**Week 2-3: 記録表示・管理機能**
7. 記録取得 API 実装
8. React UI：Dashboard・RecordDetail コンポーネント開発
9. 記録編集・削除機能
10. アレルギーフィルター実装

### Phase 2：統計・グラフ機能（推定 1-2週間）

**Week 4: グラフダッシュボード**
11. 統計 API 実装（カロリー、栄養素）
12. React UI：Recharts グラフコンポーネント開発
13. アレルギー警告ダッシュボード実装

### Phase 3：本番化・デプロイ（推定 1週間）

**Week 5: テスト・デプロイメント**
14. ユニットテスト（Rust: cargo test）
15. E2E テスト（Playwright）
16. Docker化
17. 自宅サーバーデプロイメント手順書作成

---

## デプロイメント戦略

### 本番環境での起動（Docker Compose）

`docker-compose.prod.yml` でバックエンド・フロントエンド・PostgreSQL の 3 サービスをまとめて起動します。

#### 構成概要

```
[ブラウザ] → [frontend コンテナ: nginx :80]
                    ├─ /api/      → [backend コンテナ: Axum :8000]
                    └─ /uploads/  → [backend コンテナ: Axum :8000]
                                         │
                                   [postgres コンテナ :5432]
```

#### ステップ 1：sqlx クエリキャッシュの生成（初回のみ）

バックエンドは `sqlx::query!` マクロによるコンパイル時 SQL 検証を使っているため、Docker ビルド前に `backend/.sqlx/` ディレクトリの生成が必要です。これが無いと prod イメージのビルドは早期に失敗します（Dockerfile 内のチェックで停止）。

ホスト側に Rust / cargo を入れたくないので、`docker-compose.yml` に用意した
ワンショットサービス `sqlx-prepare` を使います。中で以下を順に行います：

1. 開発用 `postgres` コンテナを起動（healthcheck 通過まで待機）
2. `migrations/*.sql` を順次適用（既適用ならスキップ）
3. `rust:1-slim` コンテナ内で `sqlx-cli` をインストールし `cargo sqlx prepare` を実行
4. ホストの `backend/.sqlx/` に結果を書き出す

```bash
docker compose run --rm sqlx-prepare
```

実体スクリプトは [`scripts/sqlx-prepare.sh`](../scripts/sqlx-prepare.sh)。
通常の `docker compose up` では起動しないように `profiles: ["tools"]` を付けてあります。

生成された `.sqlx/` ディレクトリをコミットしておけば、別マシン / CI で
ビルドする際に再度この手順を踏まなくて済みます。

```bash
git add backend/.sqlx
git commit -m "chore: add sqlx query cache for offline build"
```

#### ステップ 2：環境変数の設定

プロジェクトルートに `.env` ファイルを作成します（git 管理外）。テンプレート `.env.example` をコピーして値を埋めるのが楽です。

```bash
cp .env.example .env
# エディタで POSTGRES_PASSWORD と CLAUDE_API_KEY を実値に書き換える
```

`.env` の最小構成：

```env
POSTGRES_PASSWORD=強いパスワードに変える
CLAUDE_API_KEY=sk-ant-xxxx
# POSTGRES_USER=postgres  # デフォルト値なので省略可
# RUST_LOG=info           # デフォルト値なので省略可
# PORT=80                 # デフォルト値なので省略可
```

#### ステップ 3：イメージのビルドと起動

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

#### ステップ 4：スキーマ適用（初回のみ）

prod 側の postgres は別ボリュームなので、ここでもマイグレーションを順次適用します。`migrations/` 配下の SQL を **番号順に全部** 流してください。

```bash
for f in migrations/*.sql; do
  echo "applying $f"
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d taberu_db < "$f"
done
```

個別に流したい場合：

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d taberu_db < migrations/001_initial.sql
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d taberu_db < migrations/002_add_entry_mode.sql
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d taberu_db < migrations/003_change_decimal_to_float.sql
```

#### 確認

```bash
# サービスの状態確認
docker compose -f docker-compose.prod.yml ps

# ブラウザで http://localhost を開く（または設定したポート）
curl http://localhost/api/records
```

#### 更新デプロイ

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

#### 停止・データ削除

```bash
# サービス停止（データは保持）
docker compose -f docker-compose.prod.yml down

# データも含めて完全リセット
docker compose -f docker-compose.prod.yml down -v
```

---

### バックアップ

画像ファイルと DB は Docker ボリュームで管理されています。

```bash
# 画像ファイルのバックアップ（uploads ボリューム）
docker run --rm \
  -v taberu_uploads:/data \
  -v $(pwd)/backups:/backup \
  alpine tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz /data

# DB ダンプ
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres taberu_db > backups/db_$(date +%Y%m%d).sql
```

---

### 自宅サーバー環境要件（Docker 利用時）

- **OS**: Ubuntu 22.04 LTS
- **Docker**: 24.0+、Docker Compose V2
- **ポート**: 80 番（または `PORT` 環境変数で変更可）
- SSL（HTTPS）は Nginx リバースプロキシや Caddy を前段に置いて対応

### セキュリティ考慮事項

- ✅ ファイアウォール：必要なポート（80, 443）のみ開放
- ✅ ファイルアップロード：ファイルタイプ・サイズ検証
- ✅ Claude API：API キーは環境変数で管理（Git 除外）
- ✅ データベース：ローカルネットワークのみアクセス許可
- ✅ HTTPS：Let's Encrypt で SSL/TLS 設定

---

## 開発原則

### コード品質

1. **型安全性を優先**：Rust の型システムを活用
2. **エラーハンドリング**：`Result<T, E>` で適切にエラー処理
3. **テスト駆動開発**：主要なビジネスロジックはテスト必須
4. **シンプルさ**：複雑な抽象化は避け、読みやすさを重視（学習目的のため、隠蔽しすぎない）

### 学習に関する原則

1. **「写経」ではなく「説明できる」状態を残す**：コピペで動かしたコードは、後で短くてもいいので自分の言葉でコメント／メモを残す
2. **新しい技術は最小構成で先に試す**：本体に組み込む前に、MCP/Skillsは単体の最小サンプルで挙動を理解してから統合する
3. **詰まったら "MVP優先" に立ち戻る**：学習トラックがMVP完成を阻害し始めたら、一旦素のClaude API呼び出しに戻す判断を躊躇しない

### 開発フロー

1. **ブランチ戦略**: `main` は常にデプロイ可能な状態を保つ
2. **コミットメッセージ**: 簡潔で明確に（例：`feat: add calorie chart`）
3. **コードレビュー**: PR で相互レビュー（必須）
4. **ドキュメント**: 重要な設計判断は README に記載
5. **学習ログ**: MCP/Skills など新規技術を試した結果は、短くて良いので `docs/learning-log.md` 等に記録

---

## 参考リンク

**コア技術**
- [Rust Programming Language](https://www.rust-book.rust-lang.org/)
- [Axum Web Framework](https://github.com/tokio-rs/axum)
- [Claude API Documentation](https://docs.anthropic.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Recharts Documentation](https://recharts.org/)

**学習トラック（MCP / Skills / Agent）**
- [Model Context Protocol（公式サイト）](https://modelcontextprotocol.io/) — MCPの仕様・SDK・サンプル
- [Anthropic Docs](https://docs.anthropic.com/) — Claude Skills / Agent SDK / Vision など最新機能の入口（該当セクションを参照）

---

## FAQ & トラブルシューティング

### Q: Claude API の API キー設定が難しい
**A**: `.env` ファイルに `CLAUDE_API_KEY=sk-xxx-xxx` を追加し、`dotenv` クレートで読み込む。本番環境では環境変数として設定。

### Q: 画像アップロードが失敗する
**A**: `/var/lib/taberu/uploads/` ディレクトリが存在し、書き込み権限があることを確認。`ls -la /var/lib/taberu/`

### Q: PostgreSQL に接続できない
**A**: `DATABASE_URL` が正しいか確認（`postgres://localhost/taberu_db`）。`psql postgres -c "\\l"` で DBリスト確認。

### Q: フロントエンドから API へのリクエストが 404
**A**: Nginx リバースプロキシ設定を確認。`curl http://localhost:8000/api/records` でバックエンドへの直接疎通確認。

### Q: MCPやSkillsはいつ導入すれば良い？
**A**: **Phase 1 の Step 1（素のClaude Vision呼び出しで写真→栄養JSONが返る状態）が動いてから** が原則。MVPを止めないこと。最初のMCP候補は `allergen-dictionary`（静的辞書なので軽い）か `nutrition-db`（公開データで効果が分かりやすい）が学習・実利の両面でおすすめ。

### Q: Claude Skills と通常のプロンプトの違いは？
**A**: Skillはプロンプト・出力スキーマ・補助スクリプト等を**再利用可能なパッケージ**として束ねたもの。本プロジェクトでは「アプリ本体のVision呼び出し」と「Claude Code経由のデバッグ／バッチ再分析」で同じ分析ロジックを共有する目的で使う。詳細仕様は Anthropic 公式ドキュメントを参照。

---

**最終更新**: 2026-05-16  
**プロジェクトステータス**: MVP スキャフォールド完了（Rust コンパイル・DB 動作確認が次のステップ）  
**ドキュメント変更履歴**:
- 2026-05-16：仕様変更 — 入力モード3種（成分表示ラベル読み取り・テキスト入力AI推定・手動入力）を追加。PUT /api/records/{id} に allergens フィールドを追加（編集スコープ拡張）。DBスキーマに entry_mode カラム追加。
- 2026-05-14：MVP スキャフォールド完了（backend/, frontend/, migrations/, docker-compose.yml）。開発セットアップセクションをクイックスタート形式に刷新し、Dev Container 環境の起動手順を追記。
- 2026-05-15：Dev Container クイックスタートを修正。`.devcontainer/` に Docker daemon 連携 feature が無いため、Postgres コンテナはホスト側で起動し、Dev Container 内からは `host.docker.internal` 経由で接続する手順に書き換え。
- 2026-05-14：学習トラック（コード理解 + MCP / Claude Skills）の方針を追記。AI分析仕様に段階的精度向上ステップを追加し、「MCP & Claude Skills 活用方針」セクションを新設。
- 2026-05-14：Claude Code 向けの運用ガイドを `CLAUDE.md` に分離し、領域別の詳細ルールを `.claude/rules/` 配下に切り出し。本ファイルは人間向け仕様書として「正本」の位置づけに。
- 2026-05-14：Git リポジトリ初期化（`main` ブランチ）と `.gitignore` 整備。`.devcontainer/` 配下はユーザー管理領域として運用ルールを明文化。
