mod config;
mod db;
mod error;
mod handlers;
mod models;
mod services;

use std::sync::Arc;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;
use axum::http::HeaderValue;
use tower_http::{
    cors::{Any, CorsLayer},
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

    let cors = if let Some(origin) = &config.cors_origin {
        let header_val = origin
            .parse::<HeaderValue>()
            .expect("CORS_ORIGIN must be a valid HTTP origin (e.g. http://localhost:5173, no trailing slash)");
        CorsLayer::new()
            .allow_origin(header_val)
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
        .route("/api/records", post(handlers::records::create_record))
        .route("/api/records", get(handlers::records::list_records))
        .route("/api/records/:id", put(handlers::records::update_record))
        .route("/api/records/:id", delete(handlers::records::delete_record))
        .route("/api/stats/calories", get(handlers::stats::calories_stats))
        .route("/api/stats/nutrients", get(handlers::stats::nutrients_stats))
        .nest_service("/uploads", ServeDir::new(&config.upload_dir))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
