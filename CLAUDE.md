# CLAUDE.md — Taberu 運用ガイド（Claude Code 向け）

このファイルは Claude Code が **自律的に作業するための運用ガイド** です。
人間向けのプロジェクト仕様（設計・API・スキーマ・運用すべての正本）は [README.md](README.md) に集約しています。

---

## プロジェクト概要（30秒で把握）

- **何か**：食事写真を時系列で記録する Web アプリ
- **構成**：Rust (Axum) + React (Vite + TS) + PostgreSQL + Claude Vision API
- **状態**：計画フェーズ。Git 初期化済み（main ブランチ、初期コミット完了）。`backend/`・`frontend/`・`migrations/` は **未作成**
- **動作環境**：自宅サーバー（Ubuntu）、シングルユーザー（`user_id=1` 固定）
- **学習トラック併走**：MVP を止めない範囲で MCP / Claude Skills を試す

## 最優先の判断軸（迷ったらここに戻る）

1. **MVP ファースト** — 「写真UP → AI分析 → DB保存 → 一覧表示」が動くまで他を増やさない
2. **素直な実装** — 学習目的のため、抽象化や汎用化は最小限
3. **新技術は MVP 後** — MCP / Skills / Agent SDK は本体機能が動いてから

## ディレクトリ規約

```
taberu/
├── CLAUDE.md            このファイル（エージェント運用ガイド）
├── README.md            人間向け仕様書（設計・API・運用の正本）
├── .gitignore           Node / Rust / 機密 / uploads / OS / IDE
├── .devcontainer/       開発コンテナ定義（user-managed：エージェントは編集しない）
├── backend/             Rust + Axum（未作成）
├── frontend/            React + TS + Vite（未作成）
├── migrations/          PostgreSQL マイグレーション SQL（未作成）
├── docs/                設計メモ・学習ログ
└── .claude/
    ├── rules/           領域別の詳細ルール（タスク開始時に該当を読む）
    └── skills/          Claude Skill 配置先（Phase 2 以降）
```

## 開発コマンド（環境構築後に有効）

| 用途 | コマンド |
|------|---------|
| バックエンド起動 | `cd backend && cargo run` |
| バックエンドテスト | `cd backend && cargo test` |
| Rust Lint | `cd backend && cargo clippy -- -D warnings` |
| Rust フォーマット | `cd backend && cargo fmt` |
| フロントエンド起動 | `cd frontend && npm run dev` |
| 型チェック | `cd frontend && npm run typecheck` |
| フロントエンド Lint | `cd frontend && npm run lint` |
| DB 起動（Docker） | `docker-compose up -d postgres` |

（注）コードが未着手のため、上記コマンドは `backend/` / `frontend/` をそれぞれ `cargo init` / `npm create vite@latest` で初期化した後に有効になります。

## タスク開始時のチェックリスト

1. 該当領域のルールを読む（下の表を参照）
2. 大きめの変更（3 ファイル以上・スキーマ変更・依存追加）は **Plan モード** で計画提示
3. 既存コードに触れる前に近接ファイルを Read で確認
4. DB スキーマ変更は新規マイグレーションを追加（既存ファイル編集禁止）

## 領域別詳細ルール

| 領域 | ルールファイル |
|------|---------------|
| アーキ全体・データフロー | [.claude/rules/architecture.md](.claude/rules/architecture.md) |
| Rust バックエンド | [.claude/rules/rust-backend.md](.claude/rules/rust-backend.md) |
| React フロントエンド | [.claude/rules/frontend.md](.claude/rules/frontend.md) |
| データベース | [.claude/rules/database.md](.claude/rules/database.md) |
| Claude API（画像分析） | [.claude/rules/ai-integration.md](.claude/rules/ai-integration.md) |
| MCP・Claude Skills | [.claude/rules/mcp-skills.md](.claude/rules/mcp-skills.md) |
| 学習トラック判断 | [.claude/rules/learning-track.md](.claude/rules/learning-track.md) |
| ワークフロー・コミット | [.claude/rules/workflow.md](.claude/rules/workflow.md) |

## 絶対やってはいけないこと（NG リスト）

- `.env` / `CLAUDE_API_KEY` などの機密情報をコミット
- DB に **絶対パス** を保存（必ず `uploads/...` の相対パス）
- マルチユーザー機能の前倒し実装（現状は `user_id = 1` 固定運用）
- MVP が動いていない状態で MCP / Skills 実装に着手
- 既存マイグレーションファイルの編集（必ず新規追加で対応）
- 画像処理・栄養計算ロジックの自作（既存ライブラリ + Claude API で済ませる）
- `--no-verify` などでフックをスキップしてコミット
- **`.devcontainer/` 配下の自律編集**（ユーザー管理領域。要望があれば内容提案のみ、ファイル編集は許可後）
- **`git config user.name` / `user.email` の読み書き**（git identity はユーザーが自分で管理）

## 完了条件（Definition of Done）

タスクを「完了」と報告する前に確認：

- [ ] 対象機能が手元で動く（`curl` またはブラウザで確認）
- [ ] `cargo test` / `cargo clippy` / `npm run typecheck` が通る
- [ ] 触った領域の `.claude/rules/*.md` の規約に従っている
- [ ] 新規依存を追加した場合、コミットメッセージに理由を記載
- [ ] 学習トラックで試したこと（MCP / Skills 等）は `docs/learning-log.md` に 1 行メモ

## 困ったとき

- 設計判断で迷ったら [README.md](README.md) の該当セクションを根拠にする
- 学習トラックが MVP を妨げ始めたら [.claude/rules/learning-track.md](.claude/rules/learning-track.md) の「撤退判断」を読む
- スキーマや API 仕様の **正本** は [README.md](README.md)。このファイルはあくまで運用ガイド
