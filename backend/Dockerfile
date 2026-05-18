# --- Build stage ---
FROM rust:1-slim AS builder
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Cargo.toml / Cargo.lock だけ先にコピーして依存クレートのビルドをキャッシュ
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src

# 本体ソースをコピー（.sqlx/ ディレクトリを含む）
# 事前に `docker compose run --rm sqlx-prepare` で .sqlx/ を生成しておく必要あり
COPY . .
# .sqlx/ が無いまま SQLX_OFFLINE でビルドすると不可解な大量エラーになるため早期に止める
RUN test -d .sqlx || { \
      echo ""; \
      echo "ERROR: backend/.sqlx/ is missing."; \
      echo "  Run 'docker compose run --rm sqlx-prepare' from the project root before building this image."; \
      echo ""; \
      exit 1; \
    }
ENV SQLX_OFFLINE=true
# touch でタイムスタンプを更新し、確実に再ビルドさせる
RUN touch src/main.rs && cargo build --release

# --- Runtime stage ---
FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/taberu /usr/local/bin/taberu

EXPOSE 8000
CMD ["taberu"]
