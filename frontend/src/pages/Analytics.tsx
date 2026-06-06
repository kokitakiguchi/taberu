import { useEffect, useState } from 'react';
import { fetchAllergensStats, fetchCaloriesStats, fetchNutrientsStats } from '../api/records';
import { AllergenStats } from '../components/AllergenStats';
import { CalorieChart } from '../components/CalorieChart';
import { NutrientChart } from '../components/NutrientChart';
import type { AllergensStats, CaloriesStats, NutrientsStats } from '../types';

type Period = 'week' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  week: '直近7日',
  month: '直近30日',
};

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

export function Analytics() {
  const [period, setPeriod] = useState<Period>('week');
  const [calories, setCalories] = useState<CaloriesStats | null>(null);
  const [nutrients, setNutrients] = useState<NutrientsStats | null>(null);
  const [allergens, setAllergens] = useState<AllergensStats | null>(null);
  const [caloriesLoading, setCaloriesLoading] = useState(false);
  const [nutrientsLoading, setNutrientsLoading] = useState(false);
  const [allergensLoading, setAllergensLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const hasNutrients = nutrients != null && nutrients.total_calories > 0;

  useEffect(() => {
    setCaloriesLoading(true);
    fetchCaloriesStats(period)
      .then(setCalories)
      .finally(() => setCaloriesLoading(false));
    setAllergensLoading(true);
    fetchAllergensStats(period)
      .then(setAllergens)
      .finally(() => setAllergensLoading(false));
  }, [period]);

  useEffect(() => {
    setNutrientsLoading(true);
    fetchNutrientsStats(today)
      .then(setNutrients)
      .finally(() => setNutrientsLoading(false));
  }, [today]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">分析ダッシュボード</h1>
          <p className="page-subtitle">カロリー推移と今日のPFCバランスを確認できます。</p>
        </div>

        <div className="segmented-control" role="group" aria-label="集計期間">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={period === 'week' ? 'is-active' : ''}
            aria-pressed={period === 'week'}
          >
            週
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={period === 'month' ? 'is-active' : ''}
            aria-pressed={period === 'month'}
          >
            月
          </button>
        </div>
      </header>

      <section className="stat-grid" aria-label="主要指標">
        <div className="stat-card">
          <span className="stat-label">{PERIOD_LABEL[period]}の平均</span>
          <div className="stat-value">
            {formatNumber(calories?.average_calories)}
            <span className="stat-unit">kcal/日</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">今日の合計</span>
          <div className="stat-value">
            {formatNumber(nutrients?.total_calories)}
            <span className="stat-unit">kcal</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">タンパク質</span>
          <div className="stat-value">
            {formatNumber(nutrients?.protein_g, 1)}
            <span className="stat-unit">g</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">脂質 / 炭水化物</span>
          <div className="stat-value">
            {formatNumber(nutrients?.fat_g, 1)}
            <span className="stat-unit">g</span>
            <span className="stat-unit">/ {formatNumber(nutrients?.carbs_g, 1)}g</span>
          </div>
        </div>
      </section>

      <div className="analytics-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">カロリー推移</h2>
              <p className="panel-caption">{PERIOD_LABEL[period]}の記録から日別合計を表示します。</p>
            </div>
          </div>
          {caloriesLoading && !calories ? (
            <div className="loading-state">読み込み中</div>
          ) : (
            <CalorieChart data={calories?.data ?? []} />
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">今日の栄養バランス</h2>
              <p className="panel-caption">{today} のPFC比率</p>
            </div>
          </div>
          {nutrientsLoading && !nutrients ? (
            <div className="loading-state">読み込み中</div>
          ) : hasNutrients ? (
            <NutrientChart stats={nutrients} />
          ) : (
            <div className="empty-state">記録がないため分析できません。</div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">アレルゲン</h2>
              <p className="panel-caption">{PERIOD_LABEL[period]}の記録に含まれるアレルゲン</p>
            </div>
          </div>
          {allergensLoading && !allergens ? (
            <div className="loading-state">読み込み中</div>
          ) : allergens ? (
            <AllergenStats stats={allergens} />
          ) : (
            <div className="empty-state">記録がないため分析できません。</div>
          )}
        </section>
      </div>
    </main>
  );
}
