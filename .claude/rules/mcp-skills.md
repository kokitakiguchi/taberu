# MCP / Claude Skills 運用方針

## 導入の前提条件（厳守）

MCP や Skill を **新規実装するのは MVP が動いてから**。
具体的には以下が揃っている状態が前提：

- 写真アップロード API が動く
- Claude Vision で栄養 JSON が返ってくる
- DB に保存される
- 一覧表示が動く

これが揃う前に MCP / Skills 導入で時間を使ったら、[learning-track.md](learning-track.md) の **撤退判断** を発動する。

## 構成イメージ

```
.claude/
├── rules/               本ディレクトリ
└── skills/              Skill 配置先（導入時に作成）
    ├── food-image-analyzer/
    │   ├── SKILL.md     skill のメタ情報・プロンプト
    │   └── ...
    └── ...
```

MCP サーバーの実装は本リポジトリ内 `mcp-servers/` または別リポジトリに分離。
接続情報は `.mcp.json` または Claude Code の設定で管理。

## 候補リスト

詳細は [README.md の MCP & Claude Skills セクション](../../README.md) を正本とする。

### MCP（外部知識を Claude に注入）

| 優先 | 名前 | 内容 |
|------|------|------|
| 高 | `allergen-dictionary` | 特定原材料 7 品目 + 推奨表示 21 品目を静的提供（実装が軽く効果が分かりやすい） |
| 高 | `nutrition-db` | 日本食品標準成分表（八訂）を提供 |
| 中 | `user-history` | 自分の `food_records` DB への読み取り |
| 低 | `photo-metadata` | EXIF 提供 |
| 低 | `recipe-lookup` | 公開レシピ API ラッパー |

### Skill（再利用可能なロジック束）

| 優先 | 名前 | 内容 |
|------|------|------|
| 高 | `food-image-analyzer` | 画像分析プロンプト + 出力スキーマ + バリデーション |
| 中 | `allergen-checker` | ユーザー登録アレルゲンとの突合せ |
| 中 | `nutrition-validator` | Vision 結果を DB 値で補正 |
| 低 | `meal-pattern-analyzer` | 期間集計コメント生成 |

## 導入手順テンプレート

新しい MCP / Skill を入れるときは：

1. 最小サンプルを別ディレクトリで動かす（本体に統合しない）
2. 動いたら本体への統合方法を Plan モードで提示
3. 統合後、`docs/learning-log.md` に「何ができるようになったか」を 1 〜 3 行記録
4. 既存機能のテストが通ることを確認

## 規約

- Skill のディレクトリ名は kebab-case（例：`food-image-analyzer`）
- Skill には必ずメタ情報ファイル（`SKILL.md` 等）と短い README を含める
- MCP サーバーは **読み取り専用** をデフォルトに（書き込みは慎重に判断）
- 機密情報（API キー、ユーザー入力）を MCP 経由で外部に流さない
- 公式ドキュメントを必ず参照（[Anthropic Docs](https://docs.anthropic.com/) / [Model Context Protocol](https://modelcontextprotocol.io/)）

## やってはいけないこと

- 動いている Vision 呼び出しを「Skill 化」と称して全置換する（必ず並行運用してから切替）
- MCP / Skill 内に重要なビジネスロジックを集約しすぎる（コア機能はバックエンドに残す）
- 公式ドキュメントを確認せずに Skill / MCP の仕様を推測して書く
- MCP を多重化しすぎて呼び出しグラフが複雑になる（同時稼働は 2 〜 3 個までを目安に）
