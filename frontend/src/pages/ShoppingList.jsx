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

  const lines = list.split('\n').filter(Boolean);

  function toggleCheck(line) {
    setChecked(c => ({ ...c, [line]: !c[line] }));
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="px-4 py-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-orange-500 to-red-400 rounded-2xl p-5 mb-5 shadow-sm shadow-orange-200">
        <p className="text-orange-100 text-xs font-medium mb-1">Auto-generated from your meal plan</p>
        <p className="text-white font-bold text-lg mb-4">This week's groceries</p>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 bg-white text-orange-500 font-bold rounded-xl hover:bg-orange-50 disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              Generating...
            </span>
          ) : '🛒 Generate list'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {lines.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
          <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-stone-800 text-sm">Shopping list</p>
              {checkedCount > 0 && (
                <p className="text-xs text-stone-400">{checkedCount} of {lines.filter(l => !/^[A-Z][A-Z\s]+:?$|^#+/.test(l)).length} done</p>
              )}
            </div>
            <button onClick={() => setChecked({})} className="text-xs text-stone-400 hover:text-stone-600 font-medium">
              Clear
            </button>
          </div>
          <div className="divide-y divide-stone-50">
            {lines.map((line, i) => {
              const isHeader = line.startsWith('#') || /^[A-Z][A-Z\s]+:?$/.test(line) || line.endsWith(':');
              if (isHeader) {
                return (
                  <div key={i} className="px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                      {line.replace(/^#+\s*/, '').replace(/:$/, '')}
                    </span>
                  </div>
                );
              }
              const clean = line.replace(/^[-•*]\s*/, '');
              return (
                <button key={i} onClick={() => toggleCheck(line)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors text-left">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked[line] ? 'bg-green-400 border-green-400 scale-110' : 'border-stone-300'}`}>
                    {checked[line] && <span className="text-white text-xs font-bold">✓</span>}
                  </span>
                  <span className={`text-sm transition-all ${checked[line] ? 'line-through text-stone-300' : 'text-stone-700'}`}>
                    {clean}
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
