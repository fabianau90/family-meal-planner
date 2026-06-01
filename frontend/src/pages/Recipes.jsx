import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';
import WebViewer from '../components/WebViewer';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const MEAL_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function Recipes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeMember, members } = useFamily();
  const [recipes, setRecipes] = useState([]);
  const [webResults, setWebResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanned, setScanned] = useState(null);
  const [ratings, setRatings] = useState({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [addingToPlanner, setAddingToPlanner] = useState(null); // recipe being added
  const [plannerDay, setPlannerDay] = useState(0);
  const [plannerMeal, setPlannerMeal] = useState('dinner');
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerDone, setPlannerDone] = useState(false);
  const fileRef = useRef(null);
  const searchTimeout = useRef(null);

  // Reload every time the user navigates to this page
  useEffect(() => {
    setLoading(true);
    api.getRecipes().then(res => {
      setRecipes(res.local || res);
    }).finally(() => setLoading(false));
  }, [location.key]);

  // Load ratings whenever we know who the active member is
  useEffect(() => {
    const memberId = activeMember || members[0]?.id;
    if (!memberId) return;
    api.getRatings(memberId).then(setRatings).catch(() => {});
  }, [activeMember, members]);

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
      setPage(1);
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
    const memberId = activeMember || members[0]?.id;
    if (!memberId) return;
    const prev = ratings[id];
    // Toggle off if tapping same rating again
    const newRating = prev === rating ? null : rating;
    setRatings(r => ({ ...r, [id]: newRating }));
    try {
      if (newRating === null) {
        await api.deleteRating(id, memberId);
      } else {
        await api.rateRecipe(id, { member_id: memberId, rating: newRating });
      }
    } catch (err) {
      console.error(err);
      setRatings(r => ({ ...r, [id]: prev })); // revert on error
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await api.deleteRecipe(id);
      setRecipes(prev => prev.filter(r => (r._id || r.id) !== id));
    } catch (err) { console.error(err); }
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

  async function addToPlanner() {
    if (!addingToPlanner) return;
    setPlannerSaving(true);
    try {
      await api.setMealSlot({
        week_start: getMondayOf(new Date()),
        day_index: plannerDay,
        meal_type: plannerMeal,
        recipe_id: addingToPlanner._id || addingToPlanner.id,
      });
      setPlannerDone(true);
      setTimeout(() => {
        setAddingToPlanner(null);
        setPlannerDone(false);
      }, 1200);
    } finally {
      setPlannerSaving(false);
    }
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

  const totalPages = Math.ceil(recipes.length / PAGE_SIZE);
  const pagedRecipes = recipes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          {/* Saved Recipes */}
          <div className="mb-6">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
              Saved Recipes {recipes.length > 0 && <span className="text-orange-400">({recipes.length})</span>}
            </p>
            {recipes.length === 0 ? (
              <div className="text-center py-10 bg-stone-50 rounded-2xl">
                <p className="text-2xl mb-2">📖</p>
                <p className="font-semibold text-stone-600 text-sm mb-1">No saved recipes yet</p>
                <p className="text-stone-400 text-xs">Add your first recipe or scan a photo!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {pagedRecipes.map(r => (
                    <RecipeCard
                      key={r._id || r.id}
                      recipe={r}
                      currentRating={ratings[r._id || r.id] ?? null}
                      onRate={handleRate}
                      onEdit={() => navigate(`/recipes/${r._id || r.id}/edit`)}
                      onView={() => r.source_url && setViewerUrl(r.source_url)}
                      onAddToPlanner={() => { setAddingToPlanner(r); setPlannerDay(0); setPlannerMeal('dinner'); }}
                      onDelete={() => handleDelete(r._id || r.id)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 font-bold hover:bg-orange-100 hover:text-orange-500 disabled:opacity-30 transition-colors">‹</button>
                    <span className="text-sm text-stone-500 font-medium">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 font-bold hover:bg-orange-100 hover:text-orange-500 disabled:opacity-30 transition-colors">›</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Web Search Results */}
          {(webResults.length > 0 || (search && searching)) && (
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                Search from Web {webResults.length > 0 && <span className="text-orange-400">({webResults.length})</span>}
              </p>
              <div className="space-y-3">
                {webResults.map((r, i) => (
                  <WebRecipeCard
                    key={i}
                    recipe={r}
                    onView={() => setViewerUrl(r.source_url)}
                    onSave={async () => {
                      try {
                        const extracted = await api.fetchRecipeFromUrl(r.source_url);
                        navigate('/recipes/new', { state: { prefill: extracted } });
                      } catch {
                        navigate('/recipes/new', { state: { prefill: r } });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {search && !searching && webResults.length === 0 && recipes.length === 0 && (
            <div className="text-center py-10 bg-stone-50 rounded-2xl">
              <p className="text-stone-500 text-sm">No results found for "{search}"</p>
            </div>
          )}
        </>
      )}

      {/* Add to planner modal */}
      {addingToPlanner && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => setAddingToPlanner(null)}>
          <div className="bg-white w-full rounded-t-3xl p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-stone-400 font-medium">Adding to this week</p>
                <p className="font-bold text-stone-800 leading-snug">{addingToPlanner.title}</p>
              </div>
              <button onClick={() => setAddingToPlanner(null)} className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">×</button>
            </div>

            {/* Day picker */}
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Day</p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {DAYS.map((day, i) => (
                <button key={day} onClick={() => setPlannerDay(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${plannerDay === i ? 'bg-orange-500 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {day}
                </button>
              ))}
            </div>

            {/* Meal type picker */}
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Meal</p>
            <div className="flex gap-2 mb-5">
              {MEALS.map(meal => (
                <button key={meal} onClick={() => setPlannerMeal(meal)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${plannerMeal === meal ? 'bg-orange-500 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {MEAL_EMOJI[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </button>
              ))}
            </div>

            <button onClick={addToPlanner} disabled={plannerSaving || plannerDone}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-400 text-white font-bold rounded-2xl shadow-sm shadow-orange-200 hover:shadow-md disabled:opacity-70 transition-all">
              {plannerDone ? '✓ Added to planner!' : plannerSaving ? 'Saving...' : `Add to ${DAYS[plannerDay]} ${plannerMeal}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WebRecipeCard({ recipe: r, onView, onSave }) {
  const [extracting, setExtracting] = useState(false);

  async function handleSave() {
    setExtracting(true);
    await onSave();
    setExtracting(false);
  }

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <p className="font-semibold text-stone-800 leading-snug">{r.title}</p>
        {r.description && <p className="text-sm text-stone-400 mt-1.5 line-clamp-2">{r.description}</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={extracting}
          className="text-xs text-white bg-orange-500 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center gap-1.5">
          {extracting
            ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Extracting...</>
            : '💾 Save recipe'}
        </button>
        <button onClick={onView}
          className="text-xs text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100 transition-colors">
          View recipe
        </button>
      </div>
    </div>
  );
}

function RecipeCard({ recipe: r, currentRating, onRate, onEdit, onView, onAddToPlanner, onDelete }) {
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
          <button onClick={() => onRate(r._id || r.id, 1)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${currentRating === 1 ? 'bg-green-200 ring-2 ring-green-400' : 'bg-green-50 hover:bg-green-100'}`}>👍</button>
          <button onClick={() => onRate(r._id || r.id, -1)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${currentRating === -1 ? 'bg-red-200 ring-2 ring-red-400' : 'bg-red-50 hover:bg-red-100'}`}>👎</button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onAddToPlanner}
          className="text-xs text-white bg-orange-500 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 transition-colors">
          📅 Add to planner
        </button>
        <button onClick={onEdit} className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg font-medium hover:bg-stone-200 transition-colors">Edit</button>
        {r.source_url && (
          <button onClick={onView} className="text-xs text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100 transition-colors">View source</button>
        )}
        <button onClick={onDelete} className="text-xs text-red-400 bg-red-50 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors">Delete</button>
      </div>
    </div>
  );
}
