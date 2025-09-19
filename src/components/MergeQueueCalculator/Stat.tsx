import { IconType } from 'react-icons';

interface Props {
  label: string;
  stat: number | null;
  helperText: string;
  icon: IconType;
  unit?: string;
  indicatorPct?: number; // 0..100
  indicatorColor?: string;
}

export default function Stat({
  helperText,
  label,
  stat,
  unit,
  indicatorPct,
  indicatorColor,
  ...props
}: Props) {
  return (
    <div className="stat" style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {props.icon && <props.icon />}
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'flex-end', margin: '8px 0', gap: 12 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {stat ?? 0}
          {unit && (
            <span style={{ fontSize: '0.6em', color: 'var(--theme-text-light)' }}>{unit}</span>
          )}
        </h3>
        <span style={{ color: 'var(--theme-text-light)' }}>{helperText}</span>
      </div>
      {typeof indicatorPct === 'number' && (
        <div className="meter" title={`${Math.round(indicatorPct)}%`}>
          <div
            className="meter-fill"
            style={{
              width: `${Math.max(0, Math.min(100, indicatorPct))}%`,
              background: indicatorColor || 'var(--theme-text-light)',
            }}
          />
        </div>
      )}
    </div>
  );
}
