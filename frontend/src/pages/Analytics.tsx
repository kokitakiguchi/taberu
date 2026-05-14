import { useEffect, useState } from 'react';
import { fetchCaloriesStats, fetchNutrientsStats } from '../api/records';
import { CalorieChart } from '../components/CalorieChart';
import { NutrientChart } from '../components/NutrientChart';
import type { CaloriesStats, NutrientsStats } from '../types';

export function Analytics() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [calories, setCalories] = useState<CaloriesStats | null>(null);
  const [nutrients, setNutrients] = useState<NutrientsStats | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchCaloriesStats(period).then(setCalories);
  }, [period]);

  useEffect(() => {
    fetchNutrientsStats(today).then(setNutrients);
  }, [today]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h2>分析ダッシュボード</h2>

      <section>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => setPeriod('week')}
            style={{ fontWeight: period === 'week' ? 'bold' : 'normal' }}
          >
            週
          </button>
          <button
            onClick={() => setPeriod('month')}
            style={{ fontWeight: period === 'month' ? 'bold' : 'normal' }}
          >
            月
          </button>
        </div>
        <h3>カロリー推移</h3>
        {calories ? (
          <>
            <CalorieChart data={calories.data} />
            <p>平均：{calories.average_calories.toFixed(0)} kcal/日</p>
          </>
        ) : (
          <p>読み込み中...</p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>今日の栄養バランス</h3>
        {nutrients ? <NutrientChart stats={nutrients} /> : <p>読み込み中...</p>}
      </section>
    </div>
  );
}
