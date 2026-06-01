import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const MEAL_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
  const [plan, setPlan] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(null);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMealPlan(weekStart), api.getRecipes()])
      .then(([meals, recs]) => {
        const map = {};
        meals.forEach(m => { map[`${m.day_index}-${m.meal_type}`] = m; });
        setPlan(map);
        setRecipes(recs.local || []);
      })
      .finally(() => setLoading(false));
  }, [weekStart]);

  function shiftWeek(delta) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  async function assignRecipe(recipe) {
    const { dayIndex, mealType } = picking;
    setPicking(null);
    try {
      const meal = await api.setMealSlot({ week_start: weekStart, day_index: dayIndex, meal_type: mealType, recipe_id: recipe._id || recipe.id });
      setPlan(p => ({ ...p, [`${dayIndex}-${mealType}`]: meal }));
    } catch (err) { console.error(err); }
  }

  async function openRecipe(id) {
    setLoadingRecipe(true);
    setViewRecipe(null);
    try {
      const r = await api.getRecipe(id);
      setViewRecipe(r);
    } catch (err) { console.error(err); }
    finally { setLoadingRecipe(false); }
  }

  async function clearSlot(dayIndex, mealType) {
    const existing = plan[`${dayIndex}-${mealType}`];
    if (!existing) return;
    try {
      await api.deleteMealSlot(existing._id || existing.id);
      setPlan(p => { const next = { ...p }; delete next[`${dayIndex}-${mealType}`]; return next; });
    } catch (err) { console.error(err); }
  }

  const displayDate = new Date(weekStart + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  const endDate = new Date(weekStart + 'T00:00:00');
  endDate.setDate(endDate.getDate() + 6);
  const displayEnd = endDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });

  return (
    <div className="px-4 py-6">
      {/* Week nav */}
      <div className="flex items-center justify-between mb-5 bg-gradient-to-r from-orange-500 to-red-400 rounded-2xl p-4 shadow-sm shadow-orange-200">
        <button onClick={() => shiftWeek(-1)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white font-bold transition-colors">‹</button>
        <div className="text-center">
          <p className="text-orange-100 text-xs font-medium">Current week</p>
          <p className="text-white font-bold text-sm">{displayDate} – {displayEnd}</p>
        </div>
        <button onClick={() => shiftWeek(1)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white font-bold transition-colors">›</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day, di) => (
            <div key={day} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              <div className="px-4 py-2.5 bg-gradient-to-r from-stone-50 to-orange-50/50 border-b border-stone-100">
                <span className="font-bold text-stone-700 text-sm">{day}</span>
              </div>
              <div className="divide-y divide-stone-50">
                {MEALS.map(meal => {
                  const slot = plan[`${di}-${meal}`];
                  return (
                    <div key={meal} className="flex items-center px-4 py-3 gap-3">
                      <span className="text-lg w-6 text-center flex-shrink-0">{MEAL_EMOJI[meal]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-400 font-medium mb-0.5">{MEAL_LABEL[meal]}</p>
                        {slot?.recipe_id
                          ? <button onClick={() => openRecipe(slot.recipe_id._id || slot.recipe_id.id)} className="text-sm font-semibold text-orange-600 truncate hover:underline text-left w-full">{slot.recipe_id.title}</button>
                          : <p className="text-sm text-stone-300">Not planned</p>
                        }
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setPicking({ dayIndex: di, mealType: meal })}
                          className="text-xs bg-orange-50 text-orange-500 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                          {slot ? 'Change' : 'Add'}
                        </button>
                        {slot && (
                          <button onClick={() => clearSlot(di, meal)}
                            className="w-7 h-7 flex items-center justify-center bg-stone-100 text-stone-400 rounded-lg hover:bg-red-50 hover:text-red-400 transition-colors text-sm">
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe detail modal */}
      {(loadingRecipe || viewRecipe) && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => { setViewRecipe(null); setLoadingRecipe(false); }}>
          <div className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {loadingRecipe ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : viewRecipe && (
              <>
                <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex justify-between items-start rounded-t-3xl">
                  <div className="flex-1 mr-3">
                    <p className="font-bold text-stone-800 text-lg leading-snug">{viewRecipe.title}</p>
                    {viewRecipe.cuisine && <span className="inline-block bg-orange-50 text-orange-500 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">{viewRecipe.cuisine}</span>}
                  </div>
                  <button onClick={() => setViewRecipe(null)} className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 flex-shrink-0">×</button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {viewRecipe.description && <p className="text-stone-500 text-sm leading-relaxed">{viewRecipe.description}</p>}
                  {viewRecipe.ingredients?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Ingredients</p>
                      <ul className="space-y-1">
                        {viewRecipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                            <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>{ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {viewRecipe.instructions && (
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Instructions</p>
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{viewRecipe.instructions}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recipe picker */}
      {picking && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end" onClick={() => setPicking(null)}>
          <div className="bg-white w-full rounded-t-3xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex justify-between items-center rounded-t-3xl">
              <div>
                <p className="text-xs text-stone-400 font-medium">{DAYS[picking.dayIndex]} · {MEAL_LABEL[picking.mealType]}</p>
                <p className="font-bold text-stone-800">Pick a recipe</p>
              </div>
              <button onClick={() => setPicking(null)} className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">×</button>
            </div>
            {recipes.length === 0 ? (
              <p className="text-center text-stone-400 py-10">No recipes yet. Add some first!</p>
            ) : (
              <div className="p-4 space-y-2">
                {recipes.map(r => (
                  <button key={r._id || r.id} onClick={() => assignRecipe(r)}
                    className="w-full text-left bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-[0.98]">
                    <p className="font-semibold text-stone-800 text-sm">{r.title}</p>
                    {r.cuisine && <p className="text-xs text-orange-400 mt-0.5 font-medium">{r.cuisine}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
