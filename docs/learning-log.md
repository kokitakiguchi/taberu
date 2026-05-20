# Taberu 学習ログ

`.claude/rules/learning-track.md` の運用に沿って、新しい技術（MCP, Claude Skills, Agent SDK, 不慣れな crate など）を試したときに、**短くて良いので** 結果を残すためのファイル。

書式は自由。目安は以下：

```
## YYYY-MM-DD — 何をしたか
- できたこと:
- ハマったこと:
- 次:
```

書かないより書くことが重要。詰まって撤退したときも、理由を 2〜3 行残すと将来の再挑戦が楽になる。

---

## 2026-05-14 — プロジェクト初期セットアップ

- できたこと：CLAUDE.md / README.md / `.claude/rules/*` のドキュメント整備。Git 初期化（main ブランチ）と `.gitignore` 整備。最初のコミット完了。
- 決めたこと：`.devcontainer/` 配下と `git config user.name` / `user.email` は **ユーザー管理領域**。エージェントは自律編集しない。
- 次：フロントエンド初期化（Vite + React + TS）の前に、devcontainer 側でユーザーが Claude Code CLI を導入する。

## 2026-05-14 — `git rebase --root --exec` で history を壊した（リカバリ済み）

- やったこと：author 修正のため `git rebase --root --exec 'git commit --amend --no-edit --reset-author'` を実行
- 起きたこと：commit が空 tree の dangling commit になり、main の history が消えた（`fsck --lost-found` で発見）
- 原因（推測）：`--root` の rebase は base が無いので `--exec` の amend が初回イテレーションで空 tree に対して動き、tree が空になった
- リカバリ：ファイルはディスクに残っていたので、untracked 状態から 1 コミットで作り直し
- 教訓：**ローカルだけのコミットで author を直すだけなら、`git reset --soft <pre-first-commit>` → 再コミット の方が安全**。`rebase --root` は最後の手段。

## 2026-05-14 — マルチエージェント運用方針メモ

- [docs/multi-agent-strategy.md](multi-agent-strategy.md) に方針を整理
- 方針：Phase 1 は組み込み Explore/Plan のみ、MVP 後にカスタムサブエージェントを 2〜3 体追加、その先で git worktree
- 「3 回ルール」で自動化判断（同じ問いを 3 回手で投げたら固定化）

## 2026-05-20 — main/develop 分岐の解消と `.claude/` の gitignore 運用確定

- 状況：コードは `develop`（main+9 コミットの直線）、`.claude/`（agents 5 + rules 8）は `main` のみ追跡という分岐状態だった
- やったこと：`develop` を `main` に FF 結合（コンフリクトなし）。`.claude/` は develop 由来の gitignore 設定をそのまま採用しリポジトリ非追跡に統一
- 注意点：develop の作業ツリーには `.claude/agents`・`rules` の実ファイルが無かった（gitignore かつ git rm 済み）ため、main 版の実ファイルをローカルへ手動コピーして保全
- ドキュメント整備：CLAUDE.md の「計画フェーズ・未作成」記述を実態へ更新、`docs/versioning.md` にバージョン運用方針を新規明文化（コード version の bump は今回せず）
- 教訓：**gitignore 対象の運用ファイルはブランチ間で勝手に移動しない**。分岐統合時はディスク上の実ファイル有無を必ず確認する
