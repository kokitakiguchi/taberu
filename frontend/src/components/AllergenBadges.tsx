type Props = {
  allergens: string[];
};

export function AllergenBadges({ allergens }: Props) {
  if (allergens.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {allergens.map((a) => (
        <span
          key={a}
          style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 12,
          }}
        >
          ⚠ {a}
        </span>
      ))}
    </div>
  );
}
