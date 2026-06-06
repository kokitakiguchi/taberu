mod config;
mod db;
mod error;
mod handlers;
mod models;
mod services;

use std::sync::Arc;

use axum::{
    extract::DefaultBodyLimit,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;
use axum::http::HeaderValue;
use tower_http::{
    cors::{AllowOrigin, Any, CorsLayer},
    services::ServeDir,
    trace::TraceLayer,
};

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "taberu=debug,tower_http=debug".into()),
        )
        .init();

    let config = Arc::new(Config::from_env());
    let pool = db::pool::init(&config.database_url).await;

    std::fs::create_dir_all(&config.upload_dir).expect("failed to create upload dir");

    let state = AppState { pool, config: config.clone() };

    // AllowOrigin::list でリクエストの Origin と照合する（exact/Const は照合なしで固定値を返すため不可）
    let cors = if let Some(origin) = &config.cors_origin {
        let header_val = origin
            .parse::<HeaderValue>()
            .expect("CORS_ORIGIN must be a valid HTTP origin (e.g. http://localhost:5173, no trailing slash)");
        CorsLayer::new()
            .allow_origin(AllowOrigin::list([header_val]))
            .allow_methods(Any)
            .allow_headers(Any)
    } else {
        tracing::warn!("CORS_ORIGIN not set — allowing all origins. Set in production.");
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    };

    let app = Router::new()
        // コンテナ / リバースプロキシからの死活監視用。DB や外部 API に依存しない liveness。
        .route("/health", get(|| async { "ok" }))
        .route("/api/records", post(handlers::records::create_record))
        .route("/api/records", get(handlers::records::list_records))
        .route("/api/records/:id", put(handlers::records::update_record))
        .route("/api/records/:id", delete(handlers::records::delete_record))
        .route("/api/stats/calories", get(handlers::stats::calories_stats))
        .route("/api/stats/nutrients", get(handlers::stats::nutrients_stats))
        .route("/api/stats/allergens", get(handlers::stats::allergens_stats))
        .nest_service("/uploads", ServeDir::new(&config.upload_dir))
        // axum のデフォルトボディ上限は 2MB。スマホ写真（数 MB）が弾かれるため、
        // ハンドラ側の 10MB チェックに合わせて余裕を持たせる（multipart のオーバーヘッド込み）。
        .layer(DefaultBodyLimit::max(11 * 1024 * 1024))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
