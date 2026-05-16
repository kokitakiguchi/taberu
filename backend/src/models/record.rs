use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FoodRecord {
    pub id: i32,
    pub user_id: i32,
    pub entry_mode: String,
    pub image_path: Option<String>,
    pub calories_kcal: Option<f64>,
    pub protein_g: Option<f64>,
    pub fat_g: Option<f64>,
    pub carbs_g: Option<f64>,
    pub components: Option<Value>,
    pub allergens: Option<Value>,
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

// 現スコープ：アレルゲンとメモのみ編集可能
#[derive(Debug, Deserialize)]
pub struct UpdateRecordRequest {
    pub allergens: Option<Value>,
    pub notes: Option<String>,
}
