export type EntryMode = 'dish_photo' | 'nutrition_label' | 'text_ai' | 'text_manual';

export interface Components {
  dish_name: string;
  main_ingredients: string[];
}

export interface FoodRecord {
  id: number;
  user_id: number;
  entry_mode: string;
  image_path: string | null;
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  components: Components | null;
  allergens: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordsResponse {
  data: FoodRecord[];
  total_calories: number;
}

export interface CalorieDataPoint {
  date: string;
  calories: number;
}

export interface CaloriesStats {
  period: string;
  data: CalorieDataPoint[];
  average_calories: number;
}

export interface NutrientsStats {
  date: string;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  total_calories: number;
  ratio: {
    protein_percent: number;
    fat_percent: number;
    carbs_percent: number;
  };
}

// 現スコープ：アレルゲンとメモのみ編集可能
export interface UpdateRecordPayload {
  allergens?: string[] | null;
  notes?: string;
}
