import { useState, useEffect } from 'react';
import { api } from '../lib/api';

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

export default function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
  const [plan, setPlan] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(null); // { dayIndex, mealType }

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMealPlan(weekStart), api.getRecipes()])
      .then(([meals, recs]) => {
        const map = {};
        meals.forEach(m => {
          map[`${m.day_index}-${m.meal_type}`] = m;
        });
        setPlan(map);
        setRecipes(recs);
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
      const meal = await api.setMealSlot({ week_start: weekStart, day_index: dayIndex, meal_type: mealType, recipe_id: recipe.id });
      setPlan(p => ({ ...p, [`${dayIndex}-${mealType}`]: meal }));
    } catch (err) {
      console.error(err);
    }
  }

  async function clearSlot(dayIndex, mealType) {
    const existing = plan[`${dayIndex}-${mealType}`];
    if (!existing) return;
    try {
      await api.deleteMealSlot(existing.id);
      setPlan(p => {
        const next = { ...p };
        delete next[`${dayIndex}-${mealType}`];
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  }

  const displayDate = new Date(weekStart + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  const endDate = new Date(weekStart + 'T00:00:00');
  endDate.setDate(endDate.getDate() + 6);
  const displayEnd = endDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-4">Weekly Planner</h1>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 bg-orange-50 rounded-2xl p-3">
        <button onClick={() => shiftWeek(-1)} className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-stone-600 hover:bg-orange-100">‹</button>
        <span className="text-sm font-medium text-stone-700">{displayDate} – {displayEnd}</span>
        <button onClick={() => shiftWeek(1)} className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-stone-600 hover:bg-orange-100">›</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day, di) => (
            <div key={day} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-stone-50 px-4 py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-700 text-sm">{day}</span>
              </div>
              <div className="divide-y divide-stone-50">
                {MEALS.map(meal => {
                  const slot = plan[`${di}-${meal}`];
                  return (
                    <div key={meal} className="flex items-center px-4 py-3 gap-3">
                      <span className="text-lg">{MEAL_EMOJI[meal]}</span>
                      <div className="flex-1 min-w-0">
                        {slot?.recipes ? (
                          <p className="text-sm font-medium text-stone-800 truncate">{slot.recipes.title}</p>
                        ) : (
                          <p className="text-sm text-stone-300">Not planned</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setPicking({ dayIndex: di, mealType: meal })}
                          className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-lg hover:bg-orange-100">
                          {slot ? 'Change' : 'Add'}
                        </button>
                        {slot && (
                          <button onClick={() => clearSlot(di, meal)}
                            className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1.5 rounded-lg hover:bg-stone-200">
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

      {/* Recipe picker modal */}
      {picking && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-4 py-3 flex justify-between items-center">
              <span className="font-semibold text-stone-800">Pick a recipe</span>
              <button onClick={() => setPicking(null)} className="text-stone-400 text-xl">×</button>
            </div>
            {recipes.length === 0 ? (
              <p className="text-center text-stone-400 py-8">No recipes yet. Add some first!</p>
            ) : (
              <div className="p-4 space-y-2">
                {recipes.map(r => (
                  <button key={r.id} onClick={() => assignRecipe(r)}
                    className="w-full text-left bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                    {r.cuisine && <p className="text-xs text-orange-500 mt-0.5">{r.cuisine}</p>}
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
