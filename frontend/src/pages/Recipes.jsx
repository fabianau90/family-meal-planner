import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';
import WebViewer from '../components/WebViewer';

export default function Recipes() {
  const navigate = useNavigate();
  const { activeMember } = useFamily();
  const [recipes, setRecipes] = useState([]);
  const [webResults, setWebResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanned, setScanned] = useState(null);
  const fileRef = useRef(null);
  const searchTimeout = useRef(null);

  // Initial load — top 10 most recent
  useEffect(() => {
    api.getRecipes().then(res => {
      setRecipes(res.local || res);
    }).finally(() => setLoading(false));
  }, []);

  // Search with debounce — includes web results when query present
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!search.trim()) {
      setWebResults([]);
      api.getRecipes().then(res => setRecipes(res.local || res));
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.getRecipes({ q: search, web: '1' });
        setRecipes(res.local || []);
        setWebResults(res.webResults || []);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [search]);

  async function handleRate(id, rating) {
    if (!activeMember) return;
    try { await api.rateRecipe(id, { member_id: activeMember, rating }); }
    catch (err) { console.error(err); }
  }

  async function handleScan(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setScanPreview(base64);
      setScanning(true);
      setScanned(null);
      try {
        const result = await api.scanRecipe({ image_base64: base64 });
        setScanned(result);
      } catch (err) {
        alert('Could not read recipe from photo. Try a clearer image.');
        setScanPreview(null);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveScanned() {
    if (!scanned) return;
    const recipe = await api.createRecipe({ ...scanned, added_by: activeMember });
    setScanned(null);
    setScanPreview(null);
    const res = await api.getRecipes();
    setRecipes(res.local || res);
    navigate(`/recipes/${recipe._id || recipe.id}/edit`);
  }

  const displayRecipes = recipes.slice(0, 10);

  return (
    <div className="px-4 py-6">
      <WebViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />

      {/* Actions */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => navigate('/recipes/new')}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-400 text-white py-3 rounded-2xl text-sm font-bold shadow-sm shadow-orange-200 hover:shadow-md transition-all active:scale-95"
        >
          + Add recipe
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 bg-white border-2 border-orange-200 text-orange-500 py-3 rounded-2xl text-sm font-bold hover:bg-orange-50 transition-all active:scale-95"
        >
          📷 Scan photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
      </div>

      {/* Photo scan result */}
      {(scanning || scanned) && (
        <div className="bg-white border border-orange-200 rounded-2xl overflow-hidden mb-5 shadow-sm">
          {scanPreview && <img src={scanPreview} alt="Scanned" className="w-full h-40 object-cover" />}
          {scanning ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-stone-600 font-medium">Reading recipe from photo...</p>
            </div>
          ) : scanned && (
            <div className="px-4 py-4">
              <p className="font-bold text-stone-800 mb-0.5">{scanned.title}</p>
              {scanned.cuisine && <p className="text-xs text-orange-500 font-medium mb-2">{scanned.cuisine}</p>}
              <p className="text-sm text-stone-500 mb-4">{scanned.description}</p>
              <div className="flex gap-2">
                <button onClick={saveScanned} className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
                  Save recipe
                </button>
                <button onClick={() => { setScanned(null); setScanPreview(null); }} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-500 hover:bg-stone-200">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300">{searching ? '⏳' : '🔍'}</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search saved recipes or the web..."
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Local recipes */}
          {displayRecipes.length > 0 && (
            <div className="mb-6">
              {search && <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">In your recipes</p>}
              <div className="space-y-3">
                {displayRecipes.map(r => (
                  <RecipeCard
                    key={r._id || r.id}
                    recipe={r}
                    onRate={handleRate}
                    onEdit={() => navigate(`/recipes/${r._id || r.id}/edit`)}
                    onView={() => r.source_url && setViewerUrl(r.source_url)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Web results */}
          {webResults.length > 0 && (
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">From the web</p>
              <div className="space-y-3">
                {webResults.map((r, i) => (
                  <button key={i} onClick={() => setViewerUrl(r.source_url)}
                    className="w-full text-left bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all active:scale-[0.99]">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">🌐</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm line-clamp-2 leading-snug">{r.title}</p>
                        {r.description && <p className="text-xs text-stone-400 mt-1 line-clamp-2">{r.description}</p>}
                        <p className="text-xs text-orange-400 mt-1 font-medium truncate">{r.source_url}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayRecipes.length === 0 && webResults.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📖</div>
              <p className="font-semibold text-stone-700 mb-1">{search ? 'No results found' : 'No recipes yet'}</p>
              <p className="text-stone-400 text-sm">{search ? 'Try a different search term' : 'Add your first recipe or scan a photo!'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecipeCard({ recipe: r, onRate, onEdit, onView }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-3">
          <p className="font-semibold text-stone-800 leading-snug">{r.title}</p>
          {r.cuisine && (
            <span className="inline-block bg-orange-50 text-orange-500 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">{r.cuisine}</span>
          )}
          {r.description && <p className="text-sm text-stone-400 mt-1.5 line-clamp-2">{r.description}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onRate(r._id || r.id, 1)} className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors">👍</button>
          <button onClick={() => onRate(r._id || r.id, -1)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">👎</button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg font-medium hover:bg-stone-200 transition-colors">Edit</button>
        {r.source_url && (
          <button onClick={onView} className="text-xs text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100 transition-colors">View source</button>
        )}
      </div>
    </div>
  );
}
