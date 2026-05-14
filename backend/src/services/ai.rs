use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisResult {
    pub dish_name: String,
    pub main_ingredients: Vec<String>,
    pub calories_kcal: f64,
    pub protein_g: f64,
    pub fat_g: f64,
    pub carbs_g: f64,
    pub allergens: Vec<String>,
}

impl AnalysisResult {
    fn mock() -> Self {
        Self {
            dish_name: "目玉焼き定食（モック）".to_string(),
            main_ingredients: vec!["卵".to_string(), "ご飯".to_string(), "みそ汁".to_string()],
            calories_kcal: 450.0,
            protein_g: 18.0,
            fat_g: 12.0,
            carbs_g: 65.0,
            allergens: vec!["卵".to_string(), "小麦".to_string()],
        }
    }
}

pub async fn analyze_image(
    api_key: &str,
    base64_image: &str,
    media_type: &str,
    mock: bool,
) -> Result<AnalysisResult, AppError> {
    if mock {
        return Ok(AnalysisResult::mock());
    }

    let client = reqwest::Client::new();
    let prompt = r#"以下の食べ物の写真を分析して、JSON形式で以下の情報を返してください。JSONのみを返し、他の文章は不要です。
{
  "dish_name": "料理名",
  "main_ingredients": ["食材1", "食材2", "食材3"],
  "calories_kcal": 数値,
  "protein_g": 数値,
  "fat_g": 数値,
  "carbs_g": 数値,
  "allergens": ["アレルゲン1"]
}
アレルゲンは特定原材料7品目（えび、かに、小麦、そば、卵、乳、落花生）と推奨表示21品目から該当するものを列挙してください。"#;

    let body = json!({
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_image
                    }
                },
                {
                    "type": "text",
                    "text": prompt
                }
            ]
        }]
    });

    let resp = call_with_retry(&client, api_key, &body).await?;
    let text = extract_text(&resp)?;
    parse_json_from_text(&text)
}

async fn call_with_retry(
    client: &reqwest::Client,
    api_key: &str,
    body: &Value,
) -> Result<Value, AppError> {
    let mut last_err = None;
    for attempt in 0..2 {
        if attempt > 0 {
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
        match client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(body)
            .send()
            .await
        {
            Ok(r) if r.status().is_success() => {
                return r.json::<Value>().await
                    .map_err(|e| AppError::Claude(e.to_string()));
            }
            Ok(r) => {
                let status = r.status();
                let text = r.text().await.unwrap_or_default();
                last_err = Some(AppError::Claude(format!("status {status}: {text}")));
            }
            Err(e) => {
                last_err = Some(AppError::Claude(e.to_string()));
            }
        }
    }
    Err(last_err.unwrap())
}

fn extract_text(resp: &Value) -> Result<String, AppError> {
    resp["content"]
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|c| c["text"].as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::Claude("unexpected response shape".to_string()))
}

fn parse_json_from_text(text: &str) -> Result<AnalysisResult, AppError> {
    // JSON ブロックを抽出（```json ... ``` も考慮）
    let json_str = if let Some(start) = text.find('{') {
        let end = text.rfind('}').unwrap_or(text.len() - 1);
        &text[start..=end]
    } else {
        text
    };

    serde_json::from_str(json_str)
        .map_err(|e| AppError::Claude(format!("failed to parse JSON: {e}")))
}
