import type { FoodRecord } from '../types';

type Props = {
  record: FoodRecord;
};

export function NutritionInfo({ record }: Props) {
  return (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
      <dt>カロリー</dt>
      <dd>{record.calories_kcal != null ? `${record.calories_kcal} kcal` : '—'}</dd>
      <dt>タンパク質</dt>
      <dd>{record.protein_g != null ? `${record.protein_g} g` : '—'}</dd>
      <dt>脂肪</dt>
      <dd>{record.fat_g != null ? `${record.fat_g} g` : '—'}</dd>
      <dt>炭水化物</dt>
      <dd>{record.carbs_g != null ? `${record.carbs_g} g` : '—'}</dd>
    </dl>
  );
}
