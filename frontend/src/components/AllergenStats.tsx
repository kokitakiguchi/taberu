import { useMemo, useState } from 'react';
import type { AllergensStats } from '../types';
import { AllergenBadges } from './AllergenBadges';

type Props = {
  stats: AllergensStats;
};

function formatDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

export function AllergenStats({ stats }: Props) {
  const [showAllDays, setShowAllDays] = useState(false);

  const maxCount = stats.ranking.reduce((m, r) => Math.max(m, r.count), 0);

  // 期間日数ぶんの日付軸を生成し、出現データをマージ（全日表示用）。
  const fullDays = useMemo(() => {
    const map = new Map(stats.daily.map((d) => [d.date, d.allergens]));
    const out: { date: string; allergens: string[] }[] = [];
    const today = new Date();
    for (let i = 0; i < stats.days; i += 1) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - i);
      const iso = dt.toISOString().slice(0, 10);
      out.push({ date: iso, allergens: map.get(iso) ?? [] });
    }
    return out; // 新しい日付が先頭
  }, [stats]);

  // 出現があった日のみ（新しい順）。backend データをそのまま使い、軸生成での取りこぼしを防ぐ。
  const occurrenceDays = useMemo(
    () => [...stats.daily].reverse(),
    [stats.daily],
  );

  const daysToShow = showAllDays ? fullDays : occurrenceDays;

  return (
    <div className="stack">
      <div>
        <h4 style={{ margin: '0 0 8px' }}>よく出るアレルゲン</h4>
        {stats.ranking.length === 0 ? (
          <p className="text-muted" style={{ margin: 0 }}>
            この期間のアレルゲン記録はありません
          </p>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            {stats.ranking.map((r) => (
              <div
                key={r.name}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span className="chip chip-allergen">⚠ {r.name}</span>
                <span className="text-muted" style={{ fontSize: 11, minWidth: 56 }}>
                  {r.category ?? 'その他'}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: '#eef0f3',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${maxCount > 0 ? (r.count / maxCount) * 100 : 0}%`,
                      height: '100%',
                      background: 'var(--color-allergen-border)',
                    }}
                  />
                </div>
                <span style={{ minWidth: 32, textAlign: 'right' }}>{r.count}回</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h4 style={{ margin: 0 }}>日別の出現</h4>
          <button className="btn-ghost" onClick={() => setShowAllDays((v) => !v)}>
            {showAllDays ? '出現日のみ' : '全日表示'}
          </button>
        </div>

        {daysToShow.length === 0 ? (
          <p className="text-muted" style={{ margin: 0 }}>
            この期間のアレルゲン記録はありません
          </p>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            {daysToShow.map((d) => (
              <div
                key={d.date}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span
                  className="text-muted"
                  style={{ minWidth: 44, fontSize: 12 }}
                >
                  {formatDate(d.date)}
                </span>
                {d.allergens.length > 0 ? (
                  <AllergenBadges allergens={d.allergens} />
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
