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

type Props = { values: ManualValues; onChange: (v: ManualValues) => void };

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ddd',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#555',
  marginBottom: 2,
};

export function ManualNutritionForm({ values, onChange }: Props) {
  function set(key: keyof ManualValues, val: string) {
    onChange({ ...values, [key]: val });
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div>
        <label style={labelStyle}>料理名</label>
        <input style={fieldStyle} value={values.dish_name} onChange={(e) => set('dish_name', e.target.value)} placeholder="例：ざるそば" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>カロリー (kcal)</label>
          <input style={fieldStyle} type="number" min="0" value={values.calories_kcal} onChange={(e) => set('calories_kcal', e.target.value)} placeholder="290" />
        </div>
        <div>
          <label style={labelStyle}>タンパク質 (g)</label>
          <input style={fieldStyle} type="number" min="0" value={values.protein_g} onChange={(e) => set('protein_g', e.target.value)} placeholder="12" />
        </div>
        <div>
          <label style={labelStyle}>脂質 (g)</label>
          <input style={fieldStyle} type="number" min="0" value={values.fat_g} onChange={(e) => set('fat_g', e.target.value)} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle}>炭水化物 (g)</label>
          <input style={fieldStyle} type="number" min="0" value={values.carbs_g} onChange={(e) => set('carbs_g', e.target.value)} placeholder="58" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>アレルゲン（カンマ区切り）</label>
        <input style={fieldStyle} value={values.allergens} onChange={(e) => set('allergens', e.target.value)} placeholder="例：小麦, そば" />
      </div>
    </div>
  );
}
