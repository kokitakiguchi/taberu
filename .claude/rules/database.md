# データベース規約（PostgreSQL）

## スキーマの正本

詳細スキーマは [README.md のデータベーススキーマセクション](../../README.md) を参照。
本ファイルは運用ルールに絞る。

## マイグレーション規約

- ファイル名：`NNN_short_description.sql`（例：`002_add_notes_column.sql`）
- `migrations/` ディレクトリに配置
- **既存マイグレーションファイルは絶対に編集しない**（履歴の整合性が壊れる）
- 修正が必要なら新しいマイグレーションで上書きする
- `sqlx migrate add ...` で雛形生成すると番号管理が楽

## 適用済みスキーマ変更の記録

| マイグレーション | 内容 | 状態 |
|----------------|------|------|
| `001_initial.sql` | 初期スキーマ（users, food_records, allergen_names） | 適用済み |
| `002_add_entry_mode.sql` | `food_records` に `entry_mode VARCHAR(20) DEFAULT 'dish_photo'` 追加 | **未作成・未適用** |

`002_add_entry_mode.sql` は次の実装タスクで作成する（`docs/次やること.md` 参照）。既存レコードには `DEFAULT 'dish_photo'` が自動適用される。

## カラム追加・変更時のチェック

1. 既存データの後方互換を確認（NULL 許容 or DEFAULT 必須）
2. インデックスが必要か判断（クエリパターンから逆算）
3. sqlx の型マッピングが正しく解決されるか確認（`Option<T>` 等）
4. ロールバック手順を頭の中で確認

## JSONB フィールドの扱い

- スキーマレスを乱用せず、**Rust 側の型で構造を強制**
- `serde::Deserialize` できる構造体にデシリアライズしてから扱う
- DB クエリで `->`, `->>`, `@>` を使う場合は理由をコメントに残す

```rust
#[derive(Serialize, Deserialize)]
pub struct Components {
    pub main_ingredients: Vec<String>,
    pub dish_name: String,
}
```

## インデックス方針

- 検索によく使うカラム（`user_id`, `created_at`）には貼る
- README.md に列挙されているインデックスは必ず維持
- 追加する場合はマイグレーションに理由をコメント

## 削除と外部キー

- `food_records.user_id` は `ON DELETE CASCADE`（ユーザー削除で記録も消える）
- 画像ファイルの物理削除はアプリ側で実施（DB トリガーには頼らない）

## タイムゾーン

- すべて UTC で保存（`TIMESTAMP` 型）
- 表示時にクライアント側でローカル変換
- `created_at` / `updated_at` は `DEFAULT CURRENT_TIMESTAMP`

## ローカル開発

- DB は Docker Compose 推奨（`docker-compose.yml` は別途用意。`postgres:16-alpine` をベースに、`POSTGRES_DB=taberu_db`）
- 開発 DB のデータ消去は `docker compose down -v`
- 本番 DB に対する破壊的操作（DROP, TRUNCATE）は絶対に手動実行禁止

## クエリのレビュー観点

- N+1 が起きていないか（記録一覧で関連データを引くときに注意）
- フルテーブルスキャンを誘発していないか（`EXPLAIN ANALYZE` でチェック）
- ユーザー入力を直接 SQL に埋めていないか（必ずパラメータ化）
