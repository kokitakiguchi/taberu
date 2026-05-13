# Rust バックエンド規約（Axum + sqlx）

## モジュール構成（推奨）

```
backend/src/
├── main.rs              Axum 起動、ルーター設定
├── config.rs            環境変数読み込み
├── error.rs             AppError enum、IntoResponse 実装
├── handlers/
│   ├── records.rs       /api/records 系
│   └── stats.rs         /api/stats 系
├── services/
│   ├── ai.rs            Claude API 呼び出し
│   ├── storage.rs       ファイル保存・取得
│   └── stats.rs         統計集計
├── models/
│   └── record.rs        FoodRecord 構造体
└── db/
    └── pool.rs          PgPool 初期化
```

## エラーハンドリング

- アプリ全体で `AppError` enum を使い、`thiserror` で派生
- `Result<T, AppError>` を返す。`unwrap()` / `expect()` は `main.rs` の起動処理以外で禁止
- `AppError` に `IntoResponse` を実装し、HTTP ステータスと JSON ボディに変換
- 外部エラー（sqlx, reqwest, io 等）は `#[from]` で吸収する

イメージ（実装時に調整）：

```rust
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("not found")]
    NotFound,
    #[error("database: {0}")]
    Db(#[from] sqlx::Error),
    #[error("claude api: {0}")]
    Claude(String),
}
```

## sqlx 使い方

- できるだけ `sqlx::query!` / `query_as!` マクロ（コンパイル時 SQL 検証）
- 動的 SQL が必要なケース以外で `query()` の文字列ベースは避ける
- マイグレーションは `sqlx-cli`（`sqlx migrate add ...`）で管理
- トランザクション：`pool.begin().await?` → 処理 → `tx.commit().await?`

## Axum ハンドラ

- ハンドラは薄く保つ（リクエスト解釈 → service 呼び出し → レスポンス変換）
- ビジネスロジックは `services/` に置く（ハンドラに書き下ろさない）
- 共有状態（`PgPool`, `reqwest::Client`, 設定）は `State` extractor で渡す
- 抽出器（`Json`, `Multipart`, `Query`）の使い分けはエンドポイントの性質に合わせる

## 非同期と並行性

- I/O は必ず `async`
- ブロッキング処理（画像エンコード等）は `tokio::task::spawn_blocking`
- 重い処理の並列化は `tokio::join!` または `futures::try_join_all`
- スレッドローカル状態は避ける（`Send` / `Sync` 制約に注意）

## ロギング

- `tracing` を使う。`println!` 禁止
- リクエストロギングは `tower_http::trace::TraceLayer`
- 機密情報（API キー、ユーザー入力フル）はログに残さない

## テスト

- ユニットテスト：各モジュール末尾の `#[cfg(test)] mod tests`
- 統合テスト（DB 込み）：`tests/` ディレクトリ、`#[sqlx::test]` を活用
- Claude API はモック化（テスト用フィクスチャ JSON を返す）
- 「動くまで」を最短にしつつ、外部入力を扱う関数だけはテストを書く

## 依存追加の作法

- 追加前に「標準・既存依存で済まないか」を一度考える
- コミットメッセージに理由を 1 行書く（例：`chore: add image crate for EXIF reading`）
- 大きめのフレームワーク追加は Plan モードで議論
