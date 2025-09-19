interface Props {
  label: string;
  value: number; // actual value in [min, max]
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

// A slider with logarithmic scale (base e) and a companion number input.
// Slider position is mapped from 0..100 to [min, max] on a log scale.
export default function LogSliderInput({
  label,
  value,
  onChange,
  min = 1,
  max = 12800,
  unit = '%',
}: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const safeMin = Math.max(min, 0.000001);
  const logMin = Math.log(safeMin);
  const logMax = Math.log(max);
  const logRange = Math.max(1e-9, logMax - logMin);

  // Convert value to slider position (0..100)
  const position = Math.round(((Math.log(clamp(value)) - logMin) / logRange) * 100);

  // Convert slider position back to value
  const posToValue = (pos: number) => {
    const ratio = pos / 100;
    const v = Math.exp(logMin + ratio * logRange);
    return clamp(Math.round(v));
  };

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <span style={{ color: 'var(--theme-text-light)' }}>
          {value}
          {unit}
        </span>
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 'auto' }}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(e) => onChange(posToValue(Number(e.target.value)))}
        />
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ width: 90 }}
        />
      </div>
    </label>
  );
}
