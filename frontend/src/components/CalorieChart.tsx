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
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis unit=" kcal" tick={{ fontSize: 11 }} width={72} />
        <Tooltip formatter={(v: number) => [`${v} kcal`, 'カロリー']} />
        <Line type="monotone" dataKey="calories" stroke="#4f8ef7" dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
