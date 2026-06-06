import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { NutrientsStats } from '../types';

type Props = {
  stats: NutrientsStats;
};

const COLORS = ['#0f766e', '#c2410c', '#7c3aed'];

export function NutrientChart({ stats }: Props) {
  const data = [
    {
      name: 'タンパク質',
      value: Math.round(stats.ratio.protein_percent * 10) / 10,
      grams: stats.protein_g,
    },
    {
      name: '脂質',
      value: Math.round(stats.ratio.fat_percent * 10) / 10,
      grams: stats.fat_g,
    },
    {
      name: '炭水化物',
      value: Math.round(stats.ratio.carbs_percent * 10) / 10,
      grams: stats.carbs_g,
    },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v}%`]} />
        </PieChart>
      </ResponsiveContainer>
      <dl className="nutrient-summary">
        {data.map((item, i) => (
          <div className="nutrient-row" key={item.name}>
            <dt className="nutrient-dot" style={{ background: COLORS[i] }} aria-label={item.name} />
            <dd>{item.name}</dd>
            <dd className="nutrient-value">
              {item.value}% / {item.grams.toFixed(1)}g
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
