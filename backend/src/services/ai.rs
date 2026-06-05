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

// 料理推定・テキスト推定用（推定に推論力が要るため標準モデル）
const MODEL_DEFAULT: &str = "claude-3-5-sonnet-20241022";
// 栄養ラベル読み取り用（印刷値の読み取りのみ＝安価モデルで十分。Haiku 4.5 は Vision 対応）
const MODEL_LABEL: &str = "claude-haiku-4-5-20251001";

const PROMPT_SUFFIX: &str = "JSONのみを返し、他の文章は不要です。アレルゲンは特定原材料7品目（えび、かに、小麦、そば、卵、乳、落花生）と推奨表示21品目から該当するものを列挙してください。";

const JSON_SCHEMA: &str = r#"{
  "dish_name": "料理名",
  "main_ingredients": ["食材1", "食材2"],
  "calories_kcal": 数値,
  "protein_g": 数値,
  "fat_g": 数値,
  "carbs_g": 数値,
  "allergens": ["アレルゲン1"]
}"#;

// dish_photo / nutrition_label モード：画像から分析
pub async fn analyze_image(
    api_key: &str,
    base64_image: &str,
    media_type: &str,
    is_nutrition_label: bool,
    mock: bool,
) -> Result<AnalysisResult, AppError> {
    if mock {
        return Ok(AnalysisResult::mock());
    }

    let prompt = if is_nutrition_label {
        format!(
            "この画像は食品パッケージの栄養成分表示ラベルです。\
印刷されている数値をそのまま読み取り、JSON形式で返してください。推定ではなく記載値を使用してください。\
一食分（または100g）の値を優先。アレルゲンは原材料名欄から読み取ってください。\
読み取れないフィールドは null を返してください。\n{JSON_SCHEMA}\n{PROMPT_SUFFIX}"
        )
    } else {
        format!(
            "以下の食べ物の写真を分析して、JSON形式で栄養情報を返してください。値はすべて推定値です。\n\
{JSON_SCHEMA}\n{PROMPT_SUFFIX}"
        )
    };

    let model = if is_nutrition_label { MODEL_LABEL } else { MODEL_DEFAULT };

    let body = json!({
        "model": model,
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

    let client = reqwest::Client::new();
    let resp = call_with_retry(&client, api_key, &body).await?;
    let text = extract_text(&resp)?;
    parse_json_from_text(&text)
}

// text_ai モード：料理名・説明文から栄養情報を推定（画像なし）
pub async fn analyze_text(
    api_key: &str,
    description: &str,
    mock: bool,
) -> Result<AnalysisResult, AppError> {
    if mock {
        return Ok(AnalysisResult::mock());
    }

    let prompt = format!(
        "以下の料理名・説明から栄養情報を推定して、JSON形式で返してください。\n\
入力：{description}\n\n{JSON_SCHEMA}\n{PROMPT_SUFFIX}"
    );

    let body = json!({
        "model": MODEL_DEFAULT,
        "max_tokens": 1024,
        "messages": [{
            "role": "user",
            "content": [{"type": "text", "text": prompt}]
        }]
    });

    let client = reqwest::Client::new();
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
    Err(last_err.expect("loop runs at least once, last_err is always set"))
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
    let json_str = if let Some(start) = text.find('{') {
        let end = text.rfind('}').unwrap_or(text.len() - 1);
        &text[start..=end]
    } else {
        text
    };

    serde_json::from_str(json_str)
        .map_err(|e| AppError::Claude(format!("failed to parse JSON: {e}")))
}
