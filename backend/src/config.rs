pub struct Config {
    pub database_url: String,
    pub claude_api_key: String,
    pub upload_dir: String,
    pub port: u16,
    pub claude_mock: bool,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            claude_api_key: std::env::var("CLAUDE_API_KEY")
                .unwrap_or_default(),
            upload_dir: std::env::var("UPLOAD_DIR")
                .unwrap_or_else(|_| "./uploads".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .expect("PORT must be a number"),
            claude_mock: std::env::var("CLAUDE_MOCK").is_ok(),
        }
    }
}
