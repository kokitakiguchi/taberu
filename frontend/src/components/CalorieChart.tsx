import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CalorieDataPoint } from '../types';

type Props = {
  data: CalorieDataPoint[];
};

export function CalorieChart({ data }: Props) {
  const hasData = data.some((point) => point.calories > 0);

  if (!hasData) {
    return <div className="empty-state">記録がないためカロリー推移を表示できません。</div>;
  }

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis unit=" kcal" tick={{ fontSize: 11, fill: '#64748b' }} width={72} />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(0)} kcal`, 'カロリー']}
            labelStyle={{ color: '#334155' }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#0f766e"
            strokeWidth={3}
            dot={{ r: 3, fill: '#0f766e' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
