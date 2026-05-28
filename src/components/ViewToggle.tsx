'use client';

export type ViewMode = 'cosmos' | 'wheel' | 'compact';

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

const MODES: { key: ViewMode; label: string }[] = [
  { key: 'cosmos', label: '3D' },
  { key: 'wheel',  label: 'Wheel' },
  { key: 'compact', label: 'List' },
];

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{ background: '#ffffff0d', border: '1px solid #ffffff12' }}>
      {MODES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="px-3 py-1 text-xs rounded-full transition-all"
          style={{
            background: value === key ? '#2196D4' : 'transparent',
            color: value === key ? '#fff' : '#ffffff60',
            fontWeight: value === key ? 600 : 400,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
