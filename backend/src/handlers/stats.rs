use axum::{extract::{Query, State}, Json};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{error::AppError, AppState};

#[derive(Deserialize)]
pub struct CaloriesQuery {
    pub period: Option<String>, // "week" | "month"
}

#[derive(Deserialize)]
pub struct NutrientsQuery {
    pub date: Option<String>,
}

pub async fn calories_stats(
    State(state): State<AppState>,
    Query(params): Query<CaloriesQuery>,
) -> Result<Json<Value>, AppError> {
    let days: i64 = match params.period.as_deref() {
        Some("month") => 30,
        _ => 7,
    };

    let rows = sqlx::query!(
        r#"SELECT DATE(created_at) as day, SUM(calories_kcal) as total
           FROM food_records
           WHERE user_id = 1 AND created_at >= NOW() - INTERVAL '1 day' * $1
           GROUP BY DATE(created_at)
           ORDER BY day"#,
        days
    )
    .fetch_all(&state.pool)
    .await?;

    let data: Vec<Value> = rows.iter().map(|r| json!({
        "date": r.day.map(|d| d.to_string()),
        "calories": r.total
    })).collect();

    let avg: f64 = if data.is_empty() {
        0.0
    } else {
        rows.iter().filter_map(|r| r.total).sum::<f64>() / data.len() as f64
    };

    Ok(Json(json!({
        "period": params.period.unwrap_or_else(|| "week".to_string()),
        "data": data,
        "average_calories": avg
    })))
}

pub async fn nutrients_stats(
    State(state): State<AppState>,
    Query(params): Query<NutrientsQuery>,
) -> Result<Json<Value>, AppError> {
    let date_str = params.date.unwrap_or_else(|| {
        chrono::Local::now().format("%Y-%m-%d").to_string()
    });

    let date = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
        .map_err(|_| AppError::InvalidInput("date must be YYYY-MM-DD".to_string()))?;
    let start = date.and_hms_opt(0, 0, 0).expect("(0,0,0) is always a valid time");
    let end = date.and_hms_opt(23, 59, 59).expect("(23,59,59) is always a valid time");

    let row = sqlx::query!(
        r#"SELECT
             COALESCE(SUM(calories_kcal), 0)::float8 as total_calories,
             COALESCE(SUM(protein_g), 0)::float8 as total_protein,
             COALESCE(SUM(fat_g), 0)::float8 as total_fat,
             COALESCE(SUM(carbs_g), 0)::float8 as total_carbs
           FROM food_records
           WHERE user_id = 1 AND created_at >= $1 AND created_at <= $2"#,
        start, end
    )
    .fetch_one(&state.pool)
    .await?;

    let cal = row.total_calories.unwrap_or(0.0);
    let protein = row.total_protein.unwrap_or(0.0);
    let fat = row.total_fat.unwrap_or(0.0);
    let carbs = row.total_carbs.unwrap_or(0.0);

    let (protein_pct, fat_pct, carbs_pct) = if cal > 0.0 {
        (protein * 4.0 / cal * 100.0, fat * 9.0 / cal * 100.0, carbs * 4.0 / cal * 100.0)
    } else {
        (0.0, 0.0, 0.0)
    };

    Ok(Json(json!({
        "date": date_str,
        "protein_g": protein,
        "fat_g": fat,
        "carbs_g": carbs,
        "total_calories": cal,
        "ratio": {
            "protein_percent": (protein_pct * 10.0).round() / 10.0,
            "fat_percent": (fat_pct * 10.0).round() / 10.0,
            "carbs_percent": (carbs_pct * 10.0).round() / 10.0
        }
    })))
}
