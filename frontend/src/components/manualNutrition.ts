export interface ManualValues {
  dish_name: string;
  calories_kcal: string;
  protein_g: string;
  fat_g: string;
  carbs_g: string;
  allergens: string; // カンマ区切り
}

export const EMPTY_MANUAL_VALUES: ManualValues = {
  dish_name: '',
  calories_kcal: '',
  protein_g: '',
  fat_g: '',
  carbs_g: '',
  allergens: '',
};
