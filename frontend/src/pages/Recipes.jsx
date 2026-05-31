import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';
import WebViewer from '../components/WebViewer';

export default function Recipes() {
  const navigate = useNavigate();
  const { activeMember } = useFamily();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getRecipes({ q: search }).then(setRecipes).finally(() => setLoading(false));
  }, [search]);

  async function handleRate(id, rating) {
    if (!activeMember) return;
    try { await api.rateRecipe(id, { member_id: activeMember, rating }); }
    catch (err) { console.error(err); }
  }

  return (
    <div className="px-4 py-6">
      <WebViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />

      <div className="flex items-center justify-between mb-5">
        <p className="text-stone-400 text-sm">{recipes.length} saved</p>
        <button
          onClick={() => navigate('/recipes/new')}
          className="bg-gradient-to-r from-orange-500 to-red-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-orange-200 hover:shadow-md transition-all active:scale-95"
        >
          + Add recipe
        </button>
      </div>

      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 text-base">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📖</div>
          <p className="font-semibold text-stone-700 mb-1">No recipes yet</p>
          <p className="text-stone-400 text-sm">Add your first recipe to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map(r => (
            <div key={r._id || r.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-3">
                  <p className="font-semibold text-stone-800 leading-snug">{r.title}</p>
                  {r.cuisine && (
                    <span className="inline-block bg-orange-50 text-orange-500 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">{r.cuisine}</span>
                  )}
                  {r.description && <p className="text-sm text-stone-400 mt-1.5 line-clamp-2">{r.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleRate(r._id || r.id, 1)} className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors text-base">👍</button>
                  <button onClick={() => handleRate(r._id || r.id, -1)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors text-base">👎</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/recipes/${r._id || r.id}/edit`)}
                  className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg font-medium hover:bg-stone-200 transition-colors"
                >
                  Edit
                </button>
                {r.source_url && (
                  <button
                    onClick={() => setViewerUrl(r.source_url)}
                    className="text-xs text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100 transition-colors"
                  >
                    View source
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
