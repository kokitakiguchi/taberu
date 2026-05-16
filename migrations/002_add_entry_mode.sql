-- entry_mode カラムを追加。既存レコードは 'dish_photo' として扱う。
ALTER TABLE food_records
  ADD COLUMN IF NOT EXISTS entry_mode VARCHAR(20) NOT NULL DEFAULT 'dish_photo';
