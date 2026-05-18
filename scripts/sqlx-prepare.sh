#!/usr/bin/env bash
# Docker (rust:1-slim) コンテナ内で実行されるセットアップスクリプト。
# - migrations/*.sql を postgres に順次適用
# - sqlx-cli をインストールして backend/.sqlx/ を生成
#
# ホスト側からは `docker compose run --rm sqlx-prepare` で呼ばれる想定。
# cargo / sqlx-cli はキャッシュせず、毎回新規インストールする。

set -euo pipefail

echo "[1/3] Installing build deps (pkg-config, libssl-dev, postgresql-client)..."
apt-get update -qq
apt-get install -y --no-install-recommends \
  pkg-config libssl-dev postgresql-client >/dev/null

echo "[2/3] Applying migrations to postgres..."
shopt -s nullglob
for f in /work/migrations/*.sql; do
  echo "  $(basename "$f")"
  # 既に適用済みでも先に進む（CREATE TABLE 等で重複エラーになっても無視）
  PGPASSWORD=postgres psql -h postgres -U postgres -d taberu_db \
    -v ON_ERROR_STOP=0 -f "$f" >/dev/null 2>&1 || true
done

echo "[3/3] Installing sqlx-cli and generating backend/.sqlx/ ..."
cargo install sqlx-cli --no-default-features --features postgres
cd /work/backend
cargo sqlx prepare

echo ""
echo "Done. backend/.sqlx/ has been generated. Commit it if you want to share it."
