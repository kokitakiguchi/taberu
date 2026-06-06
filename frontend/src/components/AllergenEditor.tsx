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
      <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>アレルゲン</div>
      <div className="chip-list" style={{ marginBottom: 6 }}>
        {list.map((a) => (
          <span key={a} className="chip chip-allergen">
            ⚠ {a}
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
        {list.length === 0 && <span className="text-muted" style={{ fontSize: 12 }}>なし</span>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="アレルゲンを追加"
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={add} disabled={saving || !input.trim()}>
          {saving ? '...' : '追加'}
        </button>
      </div>
    </div>
  );
}
