import './Badge.css';

interface Props {
  children: React.ReactNode;
}

export default function Badge({ children }: Props) {
  return <span className="badge">{children}</span>;
}
