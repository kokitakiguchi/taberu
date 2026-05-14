use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("not found")]
    NotFound,
    #[error("database error: {0}")]
    Db(#[from] sqlx::Error),
    #[error("claude api error: {0}")]
    Claude(String),
    #[error("storage error: {0}")]
    Storage(String),
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "NOT_FOUND", self.to_string()),
            AppError::Db(e) => {
                tracing::error!("database error: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, "DB_ERROR", "internal server error".to_string())
            }
            AppError::Claude(msg) => (StatusCode::BAD_GATEWAY, "CLAUDE_ERROR", msg.clone()),
            AppError::Storage(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "STORAGE_ERROR", msg.clone()),
            AppError::InvalidInput(msg) => (StatusCode::BAD_REQUEST, "INVALID_INPUT", msg.clone()),
            AppError::Io(e) => {
                tracing::error!("io error: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, "IO_ERROR", "internal server error".to_string())
            }
        };
        (status, Json(json!({"error": {"code": code, "message": message}}))).into_response()
    }
}
