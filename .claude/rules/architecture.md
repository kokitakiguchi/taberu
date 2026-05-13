# アーキテクチャ規約

詳細仕様の正本は [README.md](../../README.md)。本ファイルはエージェントが守るべき運用ルールに絞る。

## レイヤー構成

```
React (5173) ──HTTP/JSON──► Axum (8000) ──SQL──► PostgreSQL
                              │
                              ├──HTTPS──► Claude API (Vision)
                              │
                              └──fs──► /var/lib/taberu/uploads/
```

## レイヤー間の責務（守るべき境界）

| レイヤー | やる | やらない |
|---------|-----|---------|
| Frontend (React) | UI 表示、フォーム、画像選択、Recharts 描画 | 画像加工、AI 呼び出し、ビジネスロジック |
| Backend (Axum) | API、ファイル保存、Claude 呼び出し、統計集計 | UI ロジック、複雑なクライアント状態管理 |
| DB (PostgreSQL) | 永続化、インデックス、外部キー整合性 | アプリケーションロジック（最小限の CHECK 制約のみ） |

境界違反の典型例（やらない）：
- フロントエンドから Claude API を直接呼ぶ（API キー漏洩リスク）
- DB のトリガー / ストアドで栄養計算を行う
- ハンドラ関数の中に画像処理ロジックを直接書く（→ `services/` に分離）

## API 設計原則

- パスは `/api/...` プレフィクス
- リソース指向 (`/api/records`, `/api/stats/calories`)
- JSON 入出力（画像アップロードのみ `multipart/form-data`）
- エラー応答の形式は統一：`{"error": {"code": "...", "message": "..."}}`
- 詳細な API 仕様は [README.md の API 仕様セクション](../../README.md) が正本

## データフロー：画像アップロード（基準フロー）

```
1. Frontend: ImageUpload コンポーネントで画像選択
2. POST /api/records (multipart) → Axum
3. Axum: 画像をローカル保存 (/var/lib/taberu/uploads/YYYYMMDD/...)
4. Axum: Claude Vision に base64 画像を送って分析 JSON を受け取る
5. Axum: food_records に INSERT（画像は相対パス、栄養データは JSONB）
6. Axum: レスポンスを JSON で返す
7. Frontend: 結果を表示し、編集 UI を提供
```

このフローを変えるときは必ず Plan モードで提案する。

## ファイルパス規約（最重要）

- DB に保存するのは **相対パス**：`uploads/20250514/user_1_xxx.jpg`
- ファイルシステム上のベースディレクトリは環境変数 `UPLOAD_DIR`
- 配信時は `UPLOAD_DIR + 相対パス` でフルパス構築
- **絶対パスを DB に入れない**（環境間の移動が壊れる）

## 環境別の差分

| 設定 | ローカル開発 | 自宅サーバー本番 |
|------|------------|----------------|
| `UPLOAD_DIR` | `./uploads`（プロジェクト相対） | `/var/lib/taberu/uploads` |
| `DATABASE_URL` | `postgres://localhost/taberu_db` | `postgres://taberu_user:***@localhost/taberu_db` |
| ログレベル | `RUST_LOG=debug` | `RUST_LOG=info` |
| CORS 許可元 | `http://localhost:5173` | `https://<自宅ドメイン>` |
