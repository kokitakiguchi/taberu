# Taberu × Claude Code マルチエージェント運用戦略

おやすみ前メモ。明日のたたき台として読んでください。
判断は急がず、Phase 1 MVP が動いてから本格導入で OK（[.claude/rules/learning-track.md](../.claude/rules/learning-track.md) の方針に沿う）。

---

## 1. Claude Code が提供する「複数エージェント」の選択肢

| # | 仕組み | 何ができる | コスト感 |
|---|--------|-----------|---------|
| A | **組み込みサブエージェント（Task ツール）** | 1 つのセッション内から `Explore` / `Plan` / `general-purpose` を呼び出して並列実行。検索や設計を委譲できる。 | 追加設定ほぼ不要。すぐ使える。 |
| B | **カスタムサブエージェント（`.claude/agents/*.md`）** | プロジェクト専用の「役割付きエージェント」を定義。ツール権限・プロンプト・モデルまで指定可。 | 1 ファイル書くだけ。再利用しやすい。 |
| C | **Git worktree + 並列セッション** | ホスト側で複数の Claude Code セッションを別 worktree に立ち上げ、ブランチを並行で進める。 | worktree 管理が必要。CLI を 2 つ開く運用。 |
| D | **Background task（`run_in_background`）** | 長時間タスクを非同期で走らせ、メインの会話を止めない。 | コード変更は不要、エージェントが呼び出すだけ。 |
| E | **Claude Agent SDK** | プログラムから Claude を呼び出して独自オーケストレーションを組む。 | 学習コスト高、本番運用向け。 |

---

## 2. Taberu 向け推奨ロードマップ

### Phase 1（MVP 構築期）: A だけで十分

- 「写真 UP → 分析 → 保存 → 表示」を作る間は **組み込みサブエージェントだけ** 使う：
  - **Explore**: ファイル探索（「`uploads` 周りを使ってる箇所どこ？」のような問い）
  - **Plan**: 設計判断（「画像分析の責務をどう分けるべきか」など）
- カスタム定義はまだ書かない。**MVP を止めるリスクの方が高い**。

### Phase 1 後半 〜 Phase 2: B（カスタムサブエージェント）を 2〜3 体だけ

`.claude/agents/` に、繰り返し使うものを最小数だけ定義する。最初の候補：

1. **`food-vision-tester.md`** — サンプル画像で Claude Vision を叩いて JSON を持って帰る「実験エージェント」
   - 用途：プロンプト改善時の A/B 試験、開発中の手動デバッグ
   - 権限：Bash（curl）、Read のみ。Write / Edit なし
2. **`migration-reviewer.md`** — 新規 SQL マイグレーション差分を README.md のスキーマと突き合わせてチェック
   - 用途：DB スキーマ変更のレビュー
   - 権限：Read, Grep のみ
3. **`record-doc-syncer.md`**（将来）— コード変更時に README.md / `.claude/rules/*` が古くなっていないか同期チェック

> 定義は 30〜60 行で書ける。本体機能の安定性に影響しないので、安全に試せる。

### Phase 2 後半 〜 Phase 3: C（git worktree）が効いてくる

- Frontend / Backend を **同時に進めたい局面** で初めて検討
- 例：`feat/calorie-chart`（フロント）と `feat/stats-api`（バック）を別 worktree で並行開発
- 注意：Postgres は片方しか繋げられない（コンフリクト回避）。devcontainer の運用方針はユーザー判断

### Phase 3 以降: D / E は要件が出てから

- D: バックエンドのバッチ再分析を Claude Code から走らせたくなったとき
- E: 本番アプリのバックエンドが Claude を呼び出す「エージェント的フロー」（[.claude/rules/ai-integration.md](../.claude/rules/ai-integration.md) の Step 4）に進んだとき

---

## 3. カスタムサブエージェントのテンプレ（参考）

```markdown
---
name: food-vision-tester
description: サンプル画像を Claude Vision に投げて栄養 JSON を取得する実験エージェント。プロンプト改善時に使う。
tools: [Bash, Read]
---

あなたは Taberu プロジェクトの Vision 分析テスト担当です。
- 与えられた画像パスに対し、現行の分析プロンプト（README.md の AI 分析仕様セクション参照）で curl を実行
- レスポンスを JSON として整形し、想定スキーマと差分があれば報告
- 画像処理ライブラリの自作はしない、curl + jq 程度で完結させる
- 失敗時はリトライせず、エラー内容をそのまま報告
```

`.claude/agents/food-vision-tester.md` として保存すれば、メイン会話から `subagent_type=food-vision-tester` で呼べる。

---

## 4. 「最初の一歩」が決まらないとき

優先度的にこの順で導入を検討：

1. **何もしない**（Phase 1 完了まで）
2. 組み込み `Explore` を 1 回使って「楽だな」と感じる
3. 同じ問いを 3 回以上 Explore に投げてると気づく → カスタム化を検討
4. それを `.claude/agents/<name>.md` に固定化する

「将来便利そう」だけで作らない。**3 回ルール**（同じ操作を 3 回手でやったら自動化）が目安。

---

## 5. 注意点

- カスタムサブエージェントの定義は **コミット対象**（チームで共有・再現可能にする）
- 機密情報（API キー、ユーザー画像）にエージェントが触れる前に、`.claude/rules/ai-integration.md` のセキュリティ条項を再確認
- エージェント間で同じファイルを編集しないように設計する（worktree なら自然と分離される）
