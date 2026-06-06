import { useState } from 'react';
import { createRecord } from '../api/records';
import type { EntryMode, FoodRecord } from '../types';
import { ManualNutritionForm } from './ManualNutritionForm';
import { EMPTY_MANUAL_VALUES } from './manualNutrition';
import type { ManualValues } from './manualNutrition';

type Props = {
  entryMode: Extract<EntryMode, 'text_ai' | 'text_manual'>;
  onCreated: (record: FoodRecord) => void;
};

export function TextEntryForm({ entryMode, onCreated }: Props) {
  const [description, setDescription] = useState('');
  const [manual, setManual] = useState<ManualValues>(EMPTY_MANUAL_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('entry_mode', entryMode);

      if (entryMode === 'text_ai') {
        if (!description.trim()) {
          setError('料理名を入力してください');
          return;
        }
        form.append('text_description', description);
      } else {
        // text_manual
        form.append('dish_name', manual.dish_name);
        form.append('text_description', manual.dish_name);
        if (manual.calories_kcal) form.append('calories_kcal', manual.calories_kcal);
        if (manual.protein_g)    form.append('protein_g', manual.protein_g);
        if (manual.fat_g)        form.append('fat_g', manual.fat_g);
        if (manual.carbs_g)      form.append('carbs_g', manual.carbs_g);
        if (manual.allergens) {
          const arr = manual.allergens.split(',').map((s) => s.trim()).filter(Boolean);
          form.append('allergens', JSON.stringify(arr));
        }
      }

      const record = await createRecord(form);
      onCreated(record);
      setDescription('');
      setManual(EMPTY_MANUAL_VALUES);
    } catch {
      setError('登録に失敗しました。もう一度試してください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      {entryMode === 'text_ai' ? (
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
            料理名・説明
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例：ざるそば、サラダチキン定食"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
            料理名を入力するとAIが栄養情報を推定します
          </p>
        </div>
      ) : (
        <ManualNutritionForm values={manual} onChange={setManual} />
      )}

      {error && <p style={{ color: 'red', fontSize: 13, margin: 0 }}>{error}</p>}

      <button type="submit" disabled={loading} style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>
        {loading ? '登録中...' : entryMode === 'text_ai' ? 'AI推定で登録' : '手動で登録'}
      </button>
    </form>
  );
}
