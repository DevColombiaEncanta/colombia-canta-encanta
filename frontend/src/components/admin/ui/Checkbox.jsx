export default function Checkbox({ label, checked, onChange, className = '' }) {
  return (
    <label className={`admin-checkbox ${className}`.trim()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
