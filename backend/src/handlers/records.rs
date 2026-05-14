use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::NaiveDate;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::{
    error::AppError,
    models::record::{FoodRecord, UpdateRecordRequest},
    services::{ai, storage},
    AppState,
};

#[derive(Deserialize)]
pub struct RecordsQuery {
    pub date: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn create_record(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut filename = "upload.jpg".to_string();

    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::InvalidInput(e.to_string()))? {
        if field.name() == Some("image") {
            if let Some(name) = field.file_name() {
                filename = name.to_string();
            }
            file_bytes = Some(field.bytes().await.map_err(|e| AppError::InvalidInput(e.to_string()))?.to_vec());
        }
    }

    let bytes = file_bytes.ok_or_else(|| AppError::InvalidInput("image field is required".to_string()))?;

    if bytes.len() > 10 * 1024 * 1024 {
        return Err(AppError::InvalidInput("image must be under 10MB".to_string()));
    }

    let saved = storage::save_and_encode(&state.config.upload_dir, bytes, &filename).await?;

    let analysis = ai::analyze_image(
        &state.config.claude_api_key,
        &saved.base64,
        &saved.media_type,
        state.config.claude_mock,
    ).await;

    let (calories, protein, fat, carbs, components, allergens) = match analysis {
        Ok(r) => {
            let components = json!({
                "dish_name": r.dish_name,
                "main_ingredients": r.main_ingredients
            });
            let allergens = json!(r.allergens);
            (Some(r.calories_kcal), Some(r.protein_g), Some(r.fat_g), Some(r.carbs_g), Some(components), Some(allergens))
        }
        Err(e) => {
            tracing::warn!("AI analysis failed: {e}");
            (None, None, None, None, None, None)
        }
    };

    let record = sqlx::query_as!(
        FoodRecord,
        r#"INSERT INTO food_records (user_id, image_path, calories_kcal, protein_g, fat_g, carbs_g, components, allergens)
           VALUES (1, $1, $2, $3, $4, $5, $6, $7)
           RETURNING *"#,
        saved.relative_path,
        calories,
        protein,
        fat,
        carbs,
        components as Option<Value>,
        allergens as Option<Value>,
    )
    .fetch_one(&state.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(json!(record))))
}

pub async fn list_records(
    State(state): State<AppState>,
    Query(params): Query<RecordsQuery>,
) -> Result<Json<Value>, AppError> {
    let limit = params.limit.unwrap_or(50);
    let offset = params.offset.unwrap_or(0);

    let records = if let Some(date_str) = &params.date {
        let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .map_err(|_| AppError::InvalidInput("date must be YYYY-MM-DD".to_string()))?;
        let start = date.and_hms_opt(0, 0, 0).unwrap();
        let end = date.and_hms_opt(23, 59, 59).unwrap();

        sqlx::query_as!(
            FoodRecord,
            "SELECT * FROM food_records WHERE user_id = 1 AND created_at >= $1 AND created_at <= $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
            start, end, limit, offset
        )
        .fetch_all(&state.pool)
        .await?
    } else {
        sqlx::query_as!(
            FoodRecord,
            "SELECT * FROM food_records WHERE user_id = 1 ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit, offset
        )
        .fetch_all(&state.pool)
        .await?
    };

    let total_calories: f64 = records.iter()
        .filter_map(|r| r.calories_kcal)
        .sum();

    Ok(Json(json!({
        "data": records,
        "total_calories": total_calories
    })))
}

pub async fn update_record(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateRecordRequest>,
) -> Result<Json<Value>, AppError> {
    let record = sqlx::query_as!(
        FoodRecord,
        r#"UPDATE food_records
           SET calories_kcal = COALESCE($1, calories_kcal),
               protein_g     = COALESCE($2, protein_g),
               fat_g         = COALESCE($3, fat_g),
               carbs_g       = COALESCE($4, carbs_g),
               components    = COALESCE($5, components),
               allergens     = COALESCE($6, allergens),
               notes         = COALESCE($7, notes),
               updated_at    = NOW()
           WHERE id = $8 AND user_id = 1
           RETURNING *"#,
        body.calories_kcal,
        body.protein_g,
        body.fat_g,
        body.carbs_g,
        body.components as Option<Value>,
        body.allergens as Option<Value>,
        body.notes,
        id,
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(json!(record)))
}

pub async fn delete_record(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<StatusCode, AppError> {
    let record = sqlx::query_as!(
        FoodRecord,
        "SELECT * FROM food_records WHERE id = $1 AND user_id = 1",
        id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(AppError::NotFound)?;

    sqlx::query!("DELETE FROM food_records WHERE id = $1", id)
        .execute(&state.pool)
        .await?;

    if let Some(path) = &record.image_path {
        storage::delete_file(&state.config.upload_dir, path).await?;
    }

    Ok(StatusCode::NO_CONTENT)
}
