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
