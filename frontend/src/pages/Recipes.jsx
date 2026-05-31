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
    api.getRecipes({ q: search }).then(setRecipes).finally(() => setLoading(false));
  }, [search]);

  async function handleRate(id, rating) {
    if (!activeMember) return alert('Select a family member first to rate');
    try {
      await api.rateRecipe(id, { member_id: activeMember, rating });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="px-4 py-6">
      <WebViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-stone-800">Recipes</h1>
        <button onClick={() => navigate('/recipes/new')}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          + Add
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search recipes..."
        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-stone-500">No recipes yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map(r => (
            <div key={r.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-3">
                  <p className="font-semibold text-stone-800">{r.title}</p>
                  {r.cuisine && <p className="text-xs text-orange-500 mt-0.5 font-medium">{r.cuisine}</p>}
                  {r.description && <p className="text-sm text-stone-500 mt-1 line-clamp-2">{r.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleRate(r.id, 1)} className="text-xl hover:scale-125 transition-transform" title="Thumbs up">👍</button>
                  <button onClick={() => handleRate(r.id, -1)} className="text-xl hover:scale-125 transition-transform" title="Thumbs down">👎</button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(`/recipes/${r.id}/edit`)}
                  className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-200">
                  Edit
                </button>
                {r.source_url && (
                  <button onClick={() => setViewerUrl(r.source_url)}
                    className="text-xs text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100">
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
