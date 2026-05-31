import { useState } from 'react';
import { api } from '../lib/api';

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function ShoppingList() {
  const [weekStart] = useState(getMondayOf(new Date()));
  const [list, setList] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState({});

  async function generate() {
    setLoading(true);
    setError('');
    setList('');
    setChecked({});
    try {
      const res = await api.generateShoppingList(weekStart);
      setList(res.shopping_list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Parse the shopping list into lines for interactive checkboxes
  const lines = list.split('\n').filter(Boolean);

  function toggleCheck(line) {
    setChecked(c => ({ ...c, [line]: !c[line] }));
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Shopping List</h1>
      <p className="text-stone-500 text-sm mb-6">Auto-generated from this week's meal plan.</p>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-colors mb-6"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : '🛒 Generate from this week\'s plan'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {lines.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
            <span className="font-semibold text-stone-700">This week's groceries</span>
            <button onClick={() => setChecked({})} className="text-xs text-stone-400 hover:text-stone-600">
              Clear checks
            </button>
          </div>
          <div className="divide-y divide-stone-50">
            {lines.map((line, i) => {
              const isHeader = line.startsWith('#') || /^[A-Z][A-Z\s]+:?$/.test(line) || line.endsWith(':');
              if (isHeader) {
                return (
                  <div key={i} className="px-4 py-2 bg-orange-50">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                      {line.replace(/^#+\s*/, '').replace(/:$/, '')}
                    </span>
                  </div>
                );
              }
              return (
                <button key={i} onClick={() => toggleCheck(line)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left">
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked[line] ? 'bg-green-500 border-green-500' : 'border-stone-300'}`}>
                    {checked[line] && <span className="text-white text-xs">✓</span>}
                  </span>
                  <span className={`text-sm ${checked[line] ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                    {line.replace(/^[-•*]\s*/, '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
