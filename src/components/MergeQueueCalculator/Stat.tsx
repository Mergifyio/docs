import { IconType } from 'react-icons';

interface Props {
  label: string;
  stat: number | null;
  helperText: string;
  icon: IconType;
}

export default function Stat({ helperText, label, stat, ...props }: Props) {
  return (
    <div className="stat" style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {props.icon && <props.icon />}
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'flex-end', margin: '8px 0', gap: 12 }}>
        <h3 style={{ margin: 0 }}>{stat ?? 0}</h3>
        <span style={{ color: 'var(--theme-text-light)' }}>{helperText}</span>
      </div>
    </div>
  );
}
