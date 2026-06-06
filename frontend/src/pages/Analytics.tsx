import { useEffect, useState } from 'react';
import { fetchAllergensStats, fetchCaloriesStats, fetchNutrientsStats } from '../api/records';
import { AllergenStats } from '../components/AllergenStats';
import { CalorieChart } from '../components/CalorieChart';
import { NutrientChart } from '../components/NutrientChart';
import type { AllergensStats, CaloriesStats, NutrientsStats } from '../types';

export function Analytics() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [calories, setCalories] = useState<CaloriesStats | null>(null);
  const [nutrients, setNutrients] = useState<NutrientsStats | null>(null);
  const [allergens, setAllergens] = useState<AllergensStats | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchCaloriesStats(period).then(setCalories);
    fetchAllergensStats(period).then(setAllergens);
  }, [period]);

  useEffect(() => {
    fetchNutrientsStats(today).then(setNutrients);
  }, [today]);

  return (
    <div className="page">
      <h2 style={{ marginTop: 0 }}>分析ダッシュボード</h2>

      <div className="toggle-group" style={{ marginBottom: 16 }}>
        <button aria-pressed={period === 'week'} onClick={() => setPeriod('week')}>
          週
        </button>
        <button aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>
          月
        </button>
      </div>

      <section className="card">
        <h3 className="card-title">カロリー推移</h3>
        {calories ? (
          <>
            <CalorieChart data={calories.data} />
            <p className="text-muted" style={{ margin: '8px 0 0' }}>
              平均：{calories.average_calories.toFixed(0)} kcal/日
            </p>
          </>
        ) : (
          <p className="text-muted">読み込み中...</p>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">今日の栄養バランス</h3>
        {nutrients ? <NutrientChart stats={nutrients} /> : <p className="text-muted">読み込み中...</p>}
      </section>

      <section className="card">
        <h3 className="card-title">アレルゲン</h3>
        {allergens ? <AllergenStats stats={allergens} /> : <p className="text-muted">読み込み中...</p>}
      </section>
    </div>
  );
}
