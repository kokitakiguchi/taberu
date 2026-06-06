import type { CSSProperties } from 'react';

type Props = {
  allergens: string[];
  style?: CSSProperties;
};

export function AllergenBadges({ allergens, style }: Props) {
  if (allergens.length === 0) return null;
  return (
    <div className="chip-list" style={style}>
      {allergens.map((a) => (
        <span key={a} className="chip chip-allergen">
          ⚠ {a}
        </span>
      ))}
    </div>
  );
}
