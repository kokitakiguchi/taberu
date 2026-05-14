import { useEffect, useState } from 'react';
import { fetchRecords } from '../api/records';
import { ImageUpload } from '../components/ImageUpload';
import { RecordList } from '../components/RecordList';
import type { FoodRecord } from '../types';

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function Dashboard() {
  const [date, setDate] = useState(toDateString(new Date()));
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRecords(date)
      .then((r) => {
        setRecords(r.data);
        setTotalCalories(r.total_calories);
      })
      .finally(() => setLoading(false));
  }, [date]);

  function handleUploaded(record: FoodRecord) {
    setRecords((prev) => [record, ...prev]);
    setTotalCalories((prev) => prev + (record.calories_kcal ?? 0));
  }

  function handleDeleted(id: number) {
    setRecords((prev) => {
      const deleted = prev.find((r) => r.id === id);
      setTotalCalories((c) => c - (deleted?.calories_kcal ?? 0));
      return prev.filter((r) => r.id !== id);
    });
  }

  function handleUpdated(updated: FoodRecord) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Taberu</h1>

      <ImageUpload onUploaded={handleUploaded} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
        <label htmlFor="date-picker">日付：</label>
        <input
          id="date-picker"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <RecordList
          records={records}
          totalCalories={totalCalories}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
