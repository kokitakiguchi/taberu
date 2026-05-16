import { useState } from 'react';
import { updateRecord } from '../api/records';
import type { FoodRecord } from '../types';

type Props = {
  recordId: number;
  allergens: string[];
  onUpdated: (record: FoodRecord) => void;
};

export function AllergenEditor({ recordId, allergens, onUpdated }: Props) {
  const [list, setList] = useState<string[]>(allergens);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(next: string[]) {
    setSaving(true);
    try {
      const updated = await updateRecord(recordId, { allergens: next });
      onUpdated(updated);
      setList(next);
    } finally {
      setSaving(false);
    }
  }

  function remove(item: string) {
    save(list.filter((a) => a !== item));
  }

  function add() {
    const trimmed = input.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setInput('');
    save([...list, trimmed]);
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>アレルゲン</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {list.map((a) => (
          <span
            key={a}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 12,
            }}
          >
            ⚠️ {a}
            <button
              onClick={() => remove(a)}
              disabled={saving}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: '#888' }}
              aria-label={`${a}を削除`}
            >
              ×
            </button>
          </span>
        ))}
        {list.length === 0 && <span style={{ fontSize: 12, color: '#aaa' }}>なし</span>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="アレルゲンを追加"
          style={{ flex: 1, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
        />
        <button onClick={add} disabled={saving || !input.trim()} style={{ padding: '4px 10px', fontSize: 13 }}>
          {saving ? '...' : '追加'}
        </button>
      </div>
    </div>
  );
}
