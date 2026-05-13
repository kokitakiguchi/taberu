# ワークフロー規約

## タスク開始時の手順

1. ユーザーの依頼を理解する（曖昧なら確認質問）
2. 該当領域の `.claude/rules/*.md` を読む
3. 既存コードに触れる場合、近接ファイルを Read で確認
4. 影響範囲が大きいタスクは **Plan モード** で計画提示
5. 実装 → 動作確認 → 完了報告

## Plan モードを使うべきとき

- 3 ファイル以上を変更しそう
- スキーマ変更を伴う
- 新しい依存追加が必要
- アーキテクチャ的な決定を含む（どの層に置くか等）
- 学習トラックの新規導入（MCP / Skill 等）

短い局所的な変更は Plan モード不要。

## コミット規約

- 形式：`<type>: <短い説明>`
- type: `feat` / `fix` / `chore` / `docs` / `refactor` / `test` / `perf`
- 例：
  - `feat: add image upload endpoint`
  - `fix: handle missing allergens field from Claude response`
  - `chore: add image crate for resizing`
- 本文（必要なら）：「なぜ」を 1 〜 3 行で
- 機密情報を含むファイルはステージしない（`.env`, `*.key` 等）

## ブランチ

- `main` は常にデプロイ可能
- 機能開発：`feat/<short-name>`、修正：`fix/<short-name>`
- 学習トラックの実験：`exp/<short-name>`（main にマージしない前提でも OK）

## 自己レビュー観点

- README.md の API 仕様・スキーマと差分が出ていないか
- `.claude/rules/*.md` の規約に違反していないか
- `unwrap()` / `panic!` / `any` を増やしていないか
- 機密情報がコミットに含まれていないか
- 触ったコードに対応するテストが通っているか

## 危険な操作の確認

以下は **必ずユーザーに確認** してから実行する：

- マイグレーションの本番 DB への適用
- `git push --force`
- 既存ファイルの大量削除
- 依存ライブラリのメジャーバージョン更新
- 外部サービスへのデータ送信（テスト目的でも）
- ブランチの削除（特にマージ前のブランチ）

## User-managed 領域（エージェントは自律編集しない）

以下のファイル / 設定は **ユーザーが自分で管理する**。要望があった場合のみ「変更案を提示」し、許可を得てから編集する：

- `.devcontainer/Dockerfile` / `devcontainer.json` / `devcontainer-lock.json` — 開発コンテナ定義
- `git config user.name` / `user.email`（global / local 問わず）— git identity
- ユーザーシェルや global な dotfile（`~/.zshrc`, `~/.gitconfig` 等）

これらに踏み込む必要が出たときは、まず提案 → 承認 → 実行 の順を守る。

## ドキュメント更新

コード変更でドキュメントが古くなったら、同じ PR で更新：

- API 仕様変更 → [README.md](../../README.md) の API セクション
- スキーマ変更 → [README.md](../../README.md) のデータベースセクション
- 規約変更 → 該当する `.claude/rules/*.md`
- 学習メモ → `docs/learning-log.md`

## エージェント側の振る舞い

- ユーザーから曖昧な指示が来たら、勝手に拡張せず確認する
- 不明な技術仕様は「分からない」と正直に言う（推測で書かない）
- 完了報告は短く。変更点と次の選択肢を簡潔に
- 大きな選択肢が複数あるときは AskUserQuestion で提示する
