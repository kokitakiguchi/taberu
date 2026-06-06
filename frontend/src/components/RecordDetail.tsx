import { useState } from 'react';
import { deleteRecord, updateRecord } from '../api/records';
import type { FoodRecord } from '../types';
import { AllergenBadges } from './AllergenBadges';
import { AllergenEditor } from './AllergenEditor';
import { NutritionInfo } from './NutritionInfo';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type Props = {
  record: FoodRecord;
  onDeleted: (id: number) => void;
  onUpdated: (record: FoodRecord) => void;
};

export function RecordDetail({ record, onDeleted, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(record.notes ?? '');
  const [saving, setSaving] = useState(false);

  const time = new Date(record.created_at).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dishName = record.components?.dish_name ?? '（名称不明）';
  const ingredients = record.components?.main_ingredients ?? [];
  const allergens = record.allergens ?? [];

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const updated = await updateRecord(record.id, { notes });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('この記録を削除しますか？')) return;
    await deleteRecord(record.id);
    onDeleted(record.id);
  }

  return (
    <div className="card" style={{ display: 'flex', gap: 12 }}>
      {record.image_path && (
        <img
          src={`${BASE_URL}/${record.image_path}`}
          alt={dishName}
          loading="lazy"
          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: 12, color: '#888' }}>{time}</span>
            <h3 style={{ margin: '2px 0', fontSize: 16 }}>{dishName}</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(!editing)}>編集</button>
            <button className="btn-danger" onClick={handleDelete}>削除</button>
          </div>
        </div>

        {ingredients.length > 0 && (
          <p style={{ margin: '4px 0', fontSize: 13, color: '#555' }}>
            {ingredients.join('・')}
          </p>
        )}

        <NutritionInfo record={record} />

        {editing ? (
          <AllergenEditor
            recordId={record.id}
            allergens={allergens}
            onUpdated={onUpdated}
          />
        ) : (
          <AllergenBadges allergens={allergens} style={{ marginTop: 4 }} />
        )}

        {editing && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="メモ"
            />
            <button className="btn-primary" onClick={handleSaveNotes} disabled={saving} style={{ marginTop: 6 }}>
              {saving ? '保存中...' : 'メモを保存'}
            </button>
            <button className="btn-ghost" onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>閉じる</button>
          </div>
        )}
        {!editing && record.notes && (
          <p style={{ margin: '4px 0', fontSize: 13, color: '#666', fontStyle: 'italic' }}>
            {record.notes}
          </p>
        )}
      </div>
    </div>
  );
}
