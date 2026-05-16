use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::NaiveDate;
use serde::Deserialize;
use serde_json::{json, Value};

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
    // multipart はストリームなので全フィールドを先に収集する
    let mut entry_mode_raw: Option<String> = None;
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut filename = "upload.jpg".to_string();
    let mut text_description: Option<String> = None;
    let mut manual_calories: Option<f64> = None;
    let mut manual_protein: Option<f64> = None;
    let mut manual_fat: Option<f64> = None;
    let mut manual_carbs: Option<f64> = None;
    let mut manual_dish_name: Option<String> = None;
    let mut manual_allergens: Option<Value> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::InvalidInput(e.to_string()))? {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "entry_mode" => {
                entry_mode_raw = Some(field.text().await.map_err(|e| AppError::InvalidInput(e.to_string()))?);
            }
            "image" => {
                if let Some(fn_) = field.file_name() {
                    filename = fn_.to_string();
                }
                let bytes = field.bytes().await.map_err(|e| AppError::InvalidInput(e.to_string()))?.to_vec();
                file_bytes = Some(bytes);
            }
            "text_description" => {
                text_description = Some(field.text().await.map_err(|e| AppError::InvalidInput(e.to_string()))?);
            }
            "calories_kcal" => {
                if let Ok(s) = field.text().await {
                    manual_calories = s.parse().ok();
                }
            }
            "protein_g" => {
                if let Ok(s) = field.text().await {
                    manual_protein = s.parse().ok();
                }
            }
            "fat_g" => {
                if let Ok(s) = field.text().await {
                    manual_fat = s.parse().ok();
                }
            }
            "carbs_g" => {
                if let Ok(s) = field.text().await {
                    manual_carbs = s.parse().ok();
                }
            }
            "dish_name" => {
                manual_dish_name = Some(field.text().await.map_err(|e| AppError::InvalidInput(e.to_string()))?);
            }
            "allergens" => {
                if let Ok(s) = field.text().await {
                    manual_allergens = serde_json::from_str(&s).ok();
                }
            }
            _ => {}
        }
    }

    let entry_mode = entry_mode_raw.unwrap_or_else(|| "dish_photo".to_string());

    let (image_path, calories, protein, fat, carbs, components, allergens) = match entry_mode.as_str() {
        "dish_photo" | "nutrition_label" => {
            let bytes = file_bytes
                .ok_or_else(|| AppError::InvalidInput("image is required for this mode".to_string()))?;
            if bytes.len() > 10 * 1024 * 1024 {
                return Err(AppError::InvalidInput("image must be under 10MB".to_string()));
            }
            let is_label = entry_mode == "nutrition_label";
            let saved = storage::save_and_encode(&state.config.upload_dir, bytes, &filename).await?;

            let analysis = ai::analyze_image(
                &state.config.claude_api_key,
                &saved.base64,
                &saved.media_type,
                is_label,
                state.config.claude_mock,
            ).await;

            match analysis {
                Ok(r) => {
                    let comp = json!({"dish_name": r.dish_name, "main_ingredients": r.main_ingredients});
                    (
                        Some(saved.relative_path),
                        Some(r.calories_kcal),
                        Some(r.protein_g),
                        Some(r.fat_g),
                        Some(r.carbs_g),
                        Some(comp),
                        Some(json!(r.allergens)),
                    )
                }
                Err(e) => {
                    tracing::warn!("AI analysis failed: {e}");
                    (Some(saved.relative_path), None, None, None, None, None, None)
                }
            }
        }
        "text_ai" => {
            let desc = text_description
                .ok_or_else(|| AppError::InvalidInput("text_description is required for text_ai mode".to_string()))?;

            let analysis = ai::analyze_text(
                &state.config.claude_api_key,
                &desc,
                state.config.claude_mock,
            ).await;

            match analysis {
                Ok(r) => {
                    let comp = json!({"dish_name": r.dish_name, "main_ingredients": r.main_ingredients});
                    (
                        None,
                        Some(r.calories_kcal),
                        Some(r.protein_g),
                        Some(r.fat_g),
                        Some(r.carbs_g),
                        Some(comp),
                        Some(json!(r.allergens)),
                    )
                }
                Err(e) => {
                    tracing::warn!("AI text analysis failed: {e}");
                    (None, None, None, None, None, None, None)
                }
            }
        }
        "text_manual" => {
            let dish = manual_dish_name
                .or_else(|| text_description.clone())
                .unwrap_or_default();
            let comp = json!({"dish_name": dish, "main_ingredients": []});
            let alrg = manual_allergens.unwrap_or_else(|| json!([]));
            (
                None,
                manual_calories,
                manual_protein,
                manual_fat,
                manual_carbs,
                Some(comp),
                Some(alrg),
            )
        }
        _ => return Err(AppError::InvalidInput(format!("unknown entry_mode: {entry_mode}"))),
    };

    let record = sqlx::query_as!(
        FoodRecord,
        r#"INSERT INTO food_records
             (user_id, entry_mode, image_path, calories_kcal, protein_g, fat_g, carbs_g, components, allergens)
           VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *"#,
        entry_mode,
        image_path,
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
    let limit = params.limit.unwrap_or(50).clamp(1, 200);
    let offset = params.offset.unwrap_or(0).max(0);

    let records = if let Some(date_str) = &params.date {
        let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .map_err(|_| AppError::InvalidInput("date must be YYYY-MM-DD".to_string()))?;
        let start = date.and_hms_opt(0, 0, 0).expect("(0,0,0) is always a valid time");
        let end = date.and_hms_opt(23, 59, 59).expect("(23,59,59) is always a valid time");

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
           SET allergens  = COALESCE($1, allergens),
               notes      = COALESCE($2, notes),
               updated_at = NOW()
           WHERE id = $3 AND user_id = 1
           RETURNING *"#,
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
