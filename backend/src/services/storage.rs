use chrono::Local;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use crate::error::AppError;

pub struct SavedImage {
    pub relative_path: String,
    pub base64: String,
    pub media_type: String,
}

pub async fn save_and_encode(
    upload_dir: &str,
    file_bytes: Vec<u8>,
    original_filename: &str,
) -> Result<SavedImage, AppError> {
    let media_type = detect_media_type(original_filename, &file_bytes);
    let ext = if media_type == "image/png" { "png" } else { "jpg" };

    let date_str = Local::now().format("%Y%m%d").to_string();
    let time_str = Local::now().format("%H%M%S").to_string();
    let random = Uuid::new_v4().to_string().replace('-', "")[..8].to_string();
    let filename = format!("user_1_{date_str}_{time_str}_{random}.{ext}");
    let relative_path = format!("uploads/{date_str}/{filename}");

    let full_dir = Path::new(upload_dir).join(&date_str);
    tokio::fs::create_dir_all(&full_dir).await?;
    let full_path: PathBuf = Path::new(upload_dir).join(&date_str).join(&filename);

    // リサイズ（5MB 超の場合）
    let processed = if file_bytes.len() > 5 * 1024 * 1024 {
        resize_image(file_bytes)?
    } else {
        file_bytes
    };

    tokio::fs::write(&full_path, &processed).await?;

    let base64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &processed);

    Ok(SavedImage { relative_path, base64, media_type })
}

pub async fn delete_file(upload_dir: &str, relative_path: &str) -> Result<(), AppError> {
    let joined = if relative_path.starts_with("uploads/") {
        Path::new(upload_dir).join(relative_path.trim_start_matches("uploads/"))
    } else {
        Path::new(upload_dir).join(relative_path)
    };

    // canonicalize で ../ 等を解決し、upload_dir の外に出ていないか検証する
    let canonical = match joined.canonicalize() {
        Ok(p) => p,
        Err(_) => return Ok(()), // ファイルが存在しない → 削除不要
    };

    let canonical_base = Path::new(upload_dir)
        .canonicalize()
        .map_err(|e| AppError::Storage(format!("upload_dir invalid: {e}")))?;

    if !canonical.starts_with(&canonical_base) {
        tracing::warn!(
            "path traversal attempt blocked: relative_path={:?}, resolved={:?}",
            relative_path,
            canonical
        );
        return Err(AppError::InvalidInput("invalid file path".to_string()));
    }

    tokio::fs::remove_file(&canonical).await?;
    Ok(())
}

fn detect_media_type(filename: &str, bytes: &[u8]) -> String {
    let lower = filename.to_lowercase();
    if lower.ends_with(".png") || bytes.starts_with(b"\x89PNG") {
        "image/png".to_string()
    } else {
        "image/jpeg".to_string()
    }
}

fn resize_image(bytes: Vec<u8>) -> Result<Vec<u8>, AppError> {
    use image::io::Reader as ImageReader;
    use std::io::Cursor;

    let img = ImageReader::new(Cursor::new(&bytes))
        .with_guessed_format()
        .map_err(|e| AppError::Storage(e.to_string()))?
        .decode()
        .map_err(|e| AppError::Storage(e.to_string()))?;

    let resized = img.resize(2000, 2000, image::imageops::FilterType::Lanczos3);

    let mut out = Vec::new();
    resized
        .write_to(&mut Cursor::new(&mut out), image::ImageOutputFormat::Jpeg(85))
        .map_err(|e| AppError::Storage(e.to_string()))?;
    Ok(out)
}
