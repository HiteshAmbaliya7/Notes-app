// "All" plus one chip per tag the user has used. Clicking the active tag keeps it selected.
export default function TagFilter({ tags, active, onSelect }) {
  return (
    <div className="tag-filter" id="tags" role="group" aria-label="Filter by tag">
      <button type="button" className={`chip ${active === '' ? 'chip-active' : ''}`} onClick={() => onSelect('')}>
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.name}
          type="button"
          className={`chip ${active === tag.name ? 'chip-active' : ''}`}
          onClick={() => onSelect(tag.name)}
        >
          {tag.name} <span className="chip-count">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}
