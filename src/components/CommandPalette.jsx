import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import { SEARCH_PAGES } from "../constants/searchPages";
import { canAny } from "../utils/permissions";

// Ctrl+K (or Cmd+K) page search. Only pages the person is allowed to open are listed.
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const list = useRef(null);

  const allowed = useMemo(
    () => SEARCH_PAGES.filter((p) => !p.perm || canAny(...[].concat(p.perm))),
    // permissions can change while the app is open, so work it out each time it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allowed.slice(0, 12);
    const score = (p) => {
      const t = p.text.toLowerCase();
      if (t.startsWith(q)) return 0;
      if (t.includes(q)) return 1;
      if (p.group.toLowerCase().includes(q)) return 2;
      if (p.words?.includes(q)) return 3;
      return 9;
    };
    return allowed.map((p) => [p, score(p)]).filter(([, s]) => s < 9).sort((a, b) => a[1] - b[1]).map(([p]) => p).slice(0, 12);
  }, [allowed, query]);

  useEffect(() => {
    if (open) { setQuery(""); setIndex(0); }
  }, [open]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open) return null;

  const go = (p) => { onClose(); navigate(p.to); };

  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && results[index]) go(results[index]);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center bg-slate-900/40 px-4 pt-[12vh]" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Search pages">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5">
          <Search size={19} className="text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            onKeyDown={onKey}
            placeholder="Search pages... (e.g. invoices, leads, calendar)"
            className="h-14 flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
          <kbd className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-400">Esc</kbd>
        </div>
        <ul ref={list} className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-10 text-center text-slate-500">No page matches &ldquo;{query}&rdquo;.</li>}
          {results.map((p, i) => (
            <li key={p.to} data-i={i}>
              <button
                onClick={() => go(p)}
                onMouseEnter={() => setIndex(i)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left ${i === index ? "bg-violet-50 text-brand" : "text-slate-700"}`}
              >
                <span className="font-medium">{p.text}</span>
                <span className="flex items-center gap-2 text-xs text-slate-400">{p.group}{i === index && <CornerDownLeft size={13} />}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Use the arrow keys to move and Enter to open. Searches pages only.</div>
      </div>
    </div>
  );
}
