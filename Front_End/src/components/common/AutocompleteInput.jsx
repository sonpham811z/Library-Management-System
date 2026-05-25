import { useState, useEffect, useRef } from 'react';

/**
 * Reusable autocomplete dropdown input.
 *
 * Props:
 *   label        – field label text
 *   placeholder  – input placeholder
 *   value        – controlled text value
 *   onChange     – (text: string) => void
 *   onSearch     – async (text: string) => Array   — returns dropdown items
 *   renderItem   – (item) => ReactNode             — renders each dropdown row
 *   onSelect     – (item) => void                  — called on row click
 *   disabled     – boolean
 *   debounce     – ms delay (default 300)
 */
export const AutocompleteInput = ({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  renderItem,
  onSelect,
  disabled = false,
  debounce = 300,
}) => {
  const [open, setOpen]           = useState(false);
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    onChange(q);
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await onSearch(q);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, debounce);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative" ref={wrapRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {searching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400 text-center">
              Không tìm thấy kết quả
            </p>
          ) : (
            results.map((item, i) => (
              <div
                key={i}
                onMouseDown={() => handleSelect(item)}
                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                {renderItem(item)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
