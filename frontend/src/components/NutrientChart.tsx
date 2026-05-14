import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { NutrientsStats } from '../types';

type Props = {
  stats: NutrientsStats;
};

const COLORS = ['#4f8ef7', '#f7984f', '#4fc97c'];

export function NutrientChart({ stats }: Props) {
  const data = [
    { name: 'タンパク質', value: Math.round(stats.ratio.protein_percent * 10) / 10 },
    { name: '脂肪', value: Math.round(stats.ratio.fat_percent * 10) / 10 },
    { name: '炭水化物', value: Math.round(stats.ratio.carbs_percent * 10) / 10 },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} ${value}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v}%`]} />
        </PieChart>
      </ResponsiveContainer>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' }}>
        <div><dt>P</dt><dd>{stats.protein_g}g</dd></div>
        <div><dt>F</dt><dd>{stats.fat_g}g</dd></div>
        <div><dt>C</dt><dd>{stats.carbs_g}g</dd></div>
      </dl>
    </div>
  );
}
