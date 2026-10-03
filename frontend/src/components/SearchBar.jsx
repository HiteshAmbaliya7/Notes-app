export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="search"
      className="input search-input"
      placeholder="Search notes by title or content"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search notes"
    />
  );
}
