# Claude API 連携規約（画像分析）

## 基本方針

- 画像分析は **Claude Vision** を使う（モデル ID は [README.md](../../README.md) の AI 分析仕様セクションが正本）
- バックエンド（Rust）から `reqwest` で Anthropic API を直接呼ぶ
- API キーは環境変数 `CLAUDE_API_KEY`。**ハードコード・ログ出力禁止**

## 入力モード別の呼び出し判定

`entry_mode` に応じて処理を切り替える。

| entry_mode         | Claude 呼び出し | 画像処理 | プロンプト種別 |
|--------------------|---------------|---------|-------------|
| `dish_photo`       | 必要           | 必要     | dish_photo 用（推定） |
| `nutrition_label`  | 必要           | 必要     | nutrition_label 用（記載値読み取り） |
| `text_ai`          | 必要           | **不要** | text_ai 用（テキスト → 推定） |
| `text_manual`      | **不要**        | **不要** | — |

各モードのプロンプト本文は [README.md の AI 分析仕様セクション](../../README.md) を正本とする。

## 呼び出しパターン

**画像モード（dish_photo / nutrition_label）**：
```
1. 画像ファイルを読む
2. 必要ならリサイズ（最大辺 2000px、5MB 以下目安）
3. base64 エンコード
4. entry_mode に対応したプロンプトを選択
5. messages API に user message として画像 + プロンプトを送信
6. レスポンスから JSON ブロックを抽出
7. serde で構造体にデシリアライズ
8. 失敗時は 1 回までリトライ（プロンプトに「JSON のみ返せ」と再強調）
```

**テキスト AI モード（text_ai）**：
```
1. text_description（料理名・説明文）を受け取る
2. text_ai 用プロンプトに埋め込む
3. messages API に user message として送信（画像なし）
4. レスポンスから JSON ブロックを抽出・デシリアライズ
5. 失敗時は 1 回までリトライ
```

**手動入力モード（text_manual）**：
```
Claude 呼び出しなし。受け取った値をそのまま DB に INSERT する。
```

## プロンプトとスキーマの正本

- プロンプト本文は [README.md の AI 分析仕様セクション](../../README.md) が正本
- 改変するときは README.md と必要に応じて Skill 側を更新
- Skill 化（[mcp-skills.md](mcp-skills.md) 参照）したら、Skill 側がプロンプトの正本になる

## レスポンスの型

期待する JSON 構造：

```rust
#[derive(Deserialize)]
struct AnalysisResult {
    dish_name: String,
    main_ingredients: Vec<String>,
    calories_kcal: f32,
    protein_g: f32,
    fat_g: f32,
    carbs_g: f32,
    allergens: Vec<String>,
}
```

- 必須フィールドが欠けていたら **エラーにして再分析を促す**（黙ってデフォルト値を入れない）
- 数値が異常値（負数、極端な値）の場合はバリデーションで弾く
- 文字列の最大長を制限（dish_name は 200 文字程度まで）

## 画像処理

- アップロード時の上限：10MB
- Claude 送信時の上限：5MB（超えたらリサイズ）
- フォーマット：JPEG / PNG（HEIC は当面非対応、必要になったら対応）
- リサイズには `image` crate を使う

## レート制限・障害時

- 429 / 5xx は指数バックオフで最大 2 回リトライ
- リトライしてもダメな場合、record 自体は作成し栄養情報を空で保存（後で再分析可能に）
- ユーザーには「分析失敗。手動入力してください」とフォールバック UI を表示

## コスト管理

- ローカル開発時はモックモード（環境変数 `CLAUDE_MOCK=1`）を実装し、固定 JSON を返す
- 開発中の API 呼び出し回数を `docs/learning-log.md` にメモ
- 実 API 呼び出しは「実装が落ち着いてから」「サンプル画像で 1 〜 3 回」が目安

## セキュリティ

- 画像はユーザー自身のものを前提（外部公開しない）
- Claude API への送信内容（特に画像）はログに残さない
- レスポンスの `dish_name` 等は DB に入る前にサニタイズ（過剰に長い文字列は切り詰め）
- 外部公開 API キーや組織キーが見えるエラーメッセージをそのままユーザーに返さない

## やってはいけないこと

- API キーをコードに直書き
- 失敗を握りつぶして固定の栄養値を保存
- 画像をリサイズせずそのまま送信（コスト・速度両面で悪化）
- フロントエンドから Claude API を直接呼ぶ
