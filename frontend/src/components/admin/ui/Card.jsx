export default function Card({ children, className = '' }) {
  return <div className={`admin-card ${className}`.trim()}>{children}</div>;
}
