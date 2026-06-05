# CLAUDE.md — Taberu 運用ガイド（Claude Code 向け）

このファイルは Claude Code が Taberu で作業するときの運用ガイドです。仕様の詳細は [README.md](README.md) と [docs/design.md](docs/design.md)、実際の正本はコードと `migrations/` です。

## プロジェクト概要

- **何か**：食事記録と栄養分析の個人向け Web アプリ
- **構成**：Rust (Axum) + React (Vite + TypeScript) + PostgreSQL + Claude API
- **状態**：MVP 機能は実装済み。次の中心は実 API 確認、運用改善、UI 改善、コスト最適化
- **運用**：シングルユーザー、`user_id = 1` 固定
- **学習トラック**：MCP / Claude Skills / Agent SDK は本体機能を壊さない範囲で個別に試す

## 判断軸

1. **コード実態を優先** — ドキュメントより実装と migration を正とする
2. **MVP を壊さない** — 既に動く記録・分析・表示・削除を回帰させない
3. **素直な実装** — 学習目的でも過剰な抽象化や未使用の汎用化を避ける
4. **新技術は隔離して試す** — MCP / Skills / Agent SDK は小さく検証してから統合判断する

## ディレクトリ規約

```
taberu/
├── CLAUDE.md            このファイル（エージェント運用ガイド）
├── README.md            入口ドキュメント
├── docs/                詳細仕様、運用メモ、学習ログ
├── backend/             Rust + Axum
├── frontend/            React + TypeScript + Vite
├── migrations/          PostgreSQL migration SQL
└── .claude/             gitignore 対象のローカル AI 指示ドキュメント
    ├── agents/          カスタムサブエージェント定義
    └── rules/           領域別ルール
```

`.claude/` は `.gitignore` 対象で git 追跡外です。ただし、このローカル環境ではユーザー指定があれば編集対象に含めます。別環境へは git 経由で同期されません。

## 開発コマンド

ホストには Rust がインストールされていない前提です。`cargo` / `rustc` / `cargo clippy` / `cargo fmt` は Dev Container 内、または Rust が入ったコンテナ内で実行してください。ホスト側で直接 Rust コマンドを実行しようとしないこと。

| 用途 | コマンド |
|------|---------|
| DB 起動 | `docker compose up -d postgres` |
| バックエンド起動 | `cd backend && cargo run` |
| バックエンドテスト | `cd backend && cargo test` |
| Rust lint | `cd backend && cargo clippy -- -D warnings` |
| Rust format | `cd backend && cargo fmt` |
| フロントエンド起動 | `cd frontend && npm run dev` |
| 型チェック | `cd frontend && npm run typecheck` |
| フロントエンド lint | `cd frontend && npm run lint` |
| sqlx cache 更新 | `docker compose run --rm sqlx-prepare` |

Migration は backend 起動時に `sqlx::migrate!` で自動適用されます。通常は手動で `psql < migrations/*.sql` を実行しません。

## タスク開始時

1. 関係する `.claude/rules/*.md` を読む
2. 既存コードや近接ドキュメントを確認する
3. 3 ファイル以上、schema、依存追加、アーキ判断を含む場合は計画を提示する
4. `.devcontainer/` と git identity はユーザー管理領域として扱う

## 領域別ルール

| 領域 | ルールファイル |
|------|---------------|
| アーキテクチャ | [.claude/rules/architecture.md](.claude/rules/architecture.md) |
| Rust backend | [.claude/rules/rust-backend.md](.claude/rules/rust-backend.md) |
| React frontend | [.claude/rules/frontend.md](.claude/rules/frontend.md) |
| Database | [.claude/rules/database.md](.claude/rules/database.md) |
| Claude API | [.claude/rules/ai-integration.md](.claude/rules/ai-integration.md) |
| MCP / Skills | [.claude/rules/mcp-skills.md](.claude/rules/mcp-skills.md) |
| 学習トラック | [.claude/rules/learning-track.md](.claude/rules/learning-track.md) |
| ワークフロー | [.claude/rules/workflow.md](.claude/rules/workflow.md) |

## NG リスト

- `.env`、API key、DB password などの機密情報をコミットする
- DB に絶対パスを保存する。画像は必ず `uploads/...` の相対パス
- 既存 migration を編集する。変更は新規 migration で行う
- フロントエンドから Claude API を直接呼ぶ
- `--no-verify` でフックをスキップしてコミットする
- `.devcontainer/` を自律編集する
- `git config user.name` / `user.email` を読み書きする
- 実 API への画像送信をユーザー確認なしにテスト目的で行う

## 完了条件

- 変更対象のコードまたはドキュメントが現実装と矛盾していない
- コード変更時は該当する `cargo test` / `cargo clippy` / `npm run typecheck` を実行または未実行理由を報告
- API、DB、AI、運用手順を変えた場合は `README.md` / `docs/design.md` / `.claude/rules/*` を同期
- 学習トラックで試したことは [docs/learning-log.md](docs/learning-log.md) に短く記録

## 困ったとき

- 実装仕様：コード、`migrations/`
- 入口：README.md
- 詳細仕様：docs/design.md
- AI/エージェント運用：CLAUDE.md、`.claude/rules/`
