import type { FoodRecord } from '../types';
import { RecordDetail } from './RecordDetail';

type Props = {
  records: FoodRecord[];
  totalCalories: number;
  onDeleted: (id: number) => void;
  onUpdated: (record: FoodRecord) => void;
};

export function RecordList({ records, totalCalories, onDeleted, onUpdated }: Props) {
  if (records.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center', padding: 32 }}>この日の記録はまだありません</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <strong>合計: {totalCalories.toFixed(0)} kcal</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {records.map((r) => (
          <RecordDetail key={r.id} record={r} onDeleted={onDeleted} onUpdated={onUpdated} />
        ))}
      </div>
    </div>
  );
}
