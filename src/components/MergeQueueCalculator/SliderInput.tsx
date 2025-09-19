interface Props {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  accentColor?: string;
}

export default function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  accentColor,
}: Props) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <span style={{ color: 'var(--theme-text-light)' }}>
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={accentColor ? { accentColor } : undefined}
      />
    </label>
  );
}
