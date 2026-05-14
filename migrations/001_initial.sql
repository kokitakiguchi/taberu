CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    allergies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id) VALUES (1);

CREATE TABLE food_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path VARCHAR(1024),
    calories_kcal DECIMAL(7,2),
    protein_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    components JSONB,
    allergens JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_records_user_id ON food_records(user_id);
CREATE INDEX idx_food_records_created_at ON food_records(created_at DESC);

CREATE TABLE allergen_names (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50)
);

INSERT INTO allergen_names (name, category) VALUES
  ('えび', '特定原材料'),
  ('かに', '特定原材料'),
  ('小麦', '特定原材料'),
  ('そば', '特定原材料'),
  ('卵', '特定原材料'),
  ('乳', '特定原材料'),
  ('落花生', '特定原材料');
