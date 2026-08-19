import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { SearchResults } from './searchApi';
import { globalSearch } from './searchApi';

function ResultSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: { id: string; label: string; sublabel: string | null }[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{title}</div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-ink-100/60"
        >
          <span className="text-sm text-ink-900">{item.label}</span>
          {item.sublabel && <span className="text-xs text-ink-500">{item.sublabel}</span>}
        </button>
      ))}
    </div>
  );
}

export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      globalSearch(query.trim())
        .then(setResults)
        .catch(() => setResults(null));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goToCustomer(id: string) {
    navigate(`/customers/${id}`);
    setIsOpen(false);
    setQuery('');
  }

  function goToTickets() {
    navigate('/tickets');
    setIsOpen(false);
    setQuery('');
  }

  function goToVehicles() {
    navigate('/vehicles');
    setIsOpen(false);
    setQuery('');
  }

  const hasResults =
    results && (results.customers.length > 0 || results.tickets.length > 0 || results.vehicles.length > 0);

  return (
    <div className="relative w-72" ref={containerRef}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search customers, tickets, vehicles…"
        className="w-full rounded-md border border-ink-300 py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-96 overflow-y-auto rounded-lg border border-ink-300/60 bg-white shadow-lg">
          {!hasResults && <p className="p-4 text-center text-sm text-ink-500">No matches.</p>}
          {results && (
            <>
              <ResultSection title="Customers" items={results.customers} onSelect={goToCustomer} />
              <ResultSection title="Tickets" items={results.tickets} onSelect={goToTickets} />
              <ResultSection title="Vehicles" items={results.vehicles} onSelect={goToVehicles} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
