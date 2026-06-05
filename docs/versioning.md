# バージョン運用方針

最終更新：2026-06-05

Taberu のバージョニングとブランチ運用のルールをまとめる。
コード仕様の正本は [README.md](../README.md) / [docs/design.md](design.md)、エージェント運用は [CLAUDE.md](../CLAUDE.md) を参照。

---

## バージョン番号（セマンティックバージョニング）

`MAJOR.MINOR.PATCH`（例：`0.1.2`）を採用する。

| 区分 | 上げるタイミング | 例 |
|------|----------------|----|
| MAJOR | 後方互換を壊す変更（API 破壊、DB スキーマ非互換など） | `1.0.0` |
| MINOR | 後方互換を保った機能追加 | `0.2.0` |
| PATCH | バグ修正・ドキュメント・小さな改善 | `0.1.3` |

- `0.x` 系の間は MVP 開発フェーズ。破壊的変更も MINOR で吸収してよい（`1.0.0` で安定版とする）。

## バージョンを表す 2 つの場所

1. **git tag**（`v0.1.2` のように `v` プレフィクス）— リリースの記録。**正本**。
2. **manifest** — `backend/Cargo.toml` の `version` と `frontend/package.json` の `version`。

> **重要**：この 2 つは常に一致させる。tag だけ進めて manifest を放置しない（過去にズレが発生した）。

## リリース手順

1. `develop` で変更を統合し、動作確認する
2. `develop` → `main` にマージ（`main` は常にデプロイ可能を維持）
3. **`main` 上で** manifest の version を上げる：
   - `backend/Cargo.toml` の `version`
   - `frontend/package.json` の `version`
4. `chore: bump version to X.Y.Z` でコミット
5. **同じ番号で** `main` 上に tag を切る：`git tag vX.Y.Z`（ローカルのみ）
6. `develop` を `main` に追従させる（FF）
7. ブランチ（`main` / `develop`）をリモートへ push する

→ 「manifest bump → コミット → tag」を 1 セットで行う。

## タグのリモート push 方針

- **本番リリースを行うまで、tag はリモートへ push しない**（ローカル管理）。
- tag のリモート push は **本番リリースのタイミングだけ**：`git push origin vX.Y.Z`。
- ブランチ（`main` / `develop`）の push はリモート tag とは独立に行ってよい。
- 誤って push した tag は `git push origin --delete vX.Y.Z` で削除できる（ローカル tag は残る）。

## ブランチモデル

| ブランチ | 役割 |
|---------|------|
| `main` | リリース安定ブランチ。常にデプロイ可能。tag はここで切る |
| `develop` | 統合ブランチ。feat/fix をここへマージして動作確認 |
| `feat-<name>` / `fix-<name>` | 作業ブランチ。`develop` へマージ |
| `exp-<name>` | 学習トラックの実験。`main`/`develop` に入れない前提でも可 |

- `.claude/` は **gitignore（リポジトリ非追跡・ローカル管理）**。ブランチ間で git 経由の移動はされない。
- ユーザーが明示した場合、ローカルの `.claude/` は編集対象に含める。ただし release や tag の成果物には含まれない。

---

## バージョン整合の履歴

- 〜`v0.1.2` までは tag のみ進み、`backend/Cargo.toml` / `frontend/package.json` の `version` は `0.1.0` のまま不整合だった。
- **2026-05-20 に `v0.1.3` で解消**：manifest（Cargo.toml / Cargo.lock / package.json）を `0.1.3` に揃え、`main` 上で tag `v0.1.3` を切った。以降は本ドキュメントのリリース手順に従い tag と manifest を常に一致させる。
- 同日、一度リモートへ push したタグ（`v0.1.0`〜`v0.1.3`）は方針に従い**リモートから削除**（ローカルには保持）。本番リリースまでリモートにはタグを置かない。

## 現状（2026-06-05 時点）

- ローカル tag: `v0.1.0` / `v0.1.1` / `v0.1.2` / `v0.1.3`（保持）
- リモート（origin）: ブランチ `main` / `develop` のみ。**tag なし**
- manifest version: `0.1.3`（Cargo.toml / Cargo.lock / package.json 一致）
- `.claude/` はローカル管理。ドキュメント同期作業ではユーザー指定により編集対象に含めることがある。
