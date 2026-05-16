import type { EntryMode } from '../types';

const MODES: { value: EntryMode; label: string }[] = [
  { value: 'dish_photo',       label: '料理写真' },
  { value: 'nutrition_label',  label: '栄養成分ラベル' },
  { value: 'text_ai',          label: 'テキスト（AI推定）' },
  { value: 'text_manual',      label: 'テキスト（手動入力）' },
];

type Props = { value: EntryMode; onChange: (m: EntryMode) => void };

export function EntryModeSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {MODES.map((m) => (
        <label
          key={m.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 20,
            border: `2px solid ${value === m.value ? '#4f8ef7' : '#ddd'}`,
            background: value === m.value ? '#f0f6ff' : '#fff',
            cursor: 'pointer',
            fontSize: 13,
            userSelect: 'none',
          }}
        >
          <input
            type="radio"
            name="entry_mode"
            value={m.value}
            checked={value === m.value}
            onChange={() => onChange(m.value)}
            style={{ display: 'none' }}
          />
          {m.label}
        </label>
      ))}
    </div>
  );
}
