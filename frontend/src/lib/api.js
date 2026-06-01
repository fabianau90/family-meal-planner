const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Family
  getMembers: () => request('/family'),
  createMember: (body) => request('/family', { method: 'POST', body }),
  getMember: (id) => request(`/family/${id}`),
  updateMember: (id, body) => request(`/family/${id}`, { method: 'PUT', body }),
  deleteMember: (id) => request(`/family/${id}`, { method: 'DELETE' }),

  // Recipes
  getRecipes: (params = {}) => request(`/recipes?${new URLSearchParams(params)}`),
  getRatings: (member_id) => request(`/recipes/ratings?member_id=${member_id}`),
  scanRecipe: (body) => request('/recipes/scan', { method: 'POST', body }),
  fetchRecipeFromUrl: (url) => request('/recipes/fetch-url', { method: 'POST', body: { url } }),
  createRecipe: (body) => request('/recipes', { method: 'POST', body }),
  getRecipe: (id) => request(`/recipes/${id}`),
  updateRecipe: (id, body) => request(`/recipes/${id}`, { method: 'PUT', body }),
  deleteRecipe: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),
  rateRecipe: (id, body) => request(`/recipes/${id}/rate`, { method: 'POST', body }),
  deleteRating: (id, member_id) => request(`/recipes/${id}/rate?member_id=${member_id}`, { method: 'DELETE' }),

  // Meal plan
  getMealPlan: (week_start) => request(`/meal-plan?week_start=${week_start}`),
  setMealSlot: (body) => request('/meal-plan', { method: 'POST', body }),
  deleteMealSlot: (id) => request(`/meal-plan/${id}`, { method: 'DELETE' }),

  // AI
  suggestMeals: (body) => request('/ai/suggest', { method: 'POST', body }),
  generateRecipe: (title) => request('/ai/generate-recipe', { method: 'POST', body: { title } }),
  searchRecipes: (query) => request('/ai/search-recipes', { method: 'POST', body: { query } }),

  // Shopping
  generateShoppingList: (week_start) => request('/shopping/generate', { method: 'POST', body: { week_start } }),
};
