import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeMember } = useFamily();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '', description: '', cuisine: '',
    ingredients: '', instructions: '', image_url: '', source_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.getRecipe(id).then(r => setForm({
        title: r.title || '',
        description: r.description || '',
        cuisine: r.cuisine || '',
        ingredients: Array.isArray(r.ingredients) ? r.ingredients.join('\n') : r.ingredients || '',
        instructions: r.instructions || '',
        image_url: r.image_url || '',
        source_url: r.source_url || '',
      }));
    }
  }, [id, isEdit]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
        added_by: activeMember || undefined,
      };
      if (isEdit) {
        await api.updateRecipe(id, payload);
      } else {
        await api.createRecipe(payload);
      }
      navigate('/recipes');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const field = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300';

  return (
    <div className="px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-orange-500 text-sm font-medium mb-4 flex items-center gap-1">
        ← Back
      </button>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">{isEdit ? 'Edit recipe' : 'Add recipe'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Recipe name *">
          <input value={form.title} onChange={set('title')} placeholder="e.g. Spaghetti Bolognese" className={field} required />
        </Field>

        <Field label="Cuisine type">
          <input value={form.cuisine} onChange={set('cuisine')} placeholder="e.g. Italian, Asian..." className={field} />
        </Field>

        <Field label="Description">
          <textarea value={form.description} onChange={set('description')} rows={2}
            placeholder="Brief description of the dish..." className={`${field} resize-none`} />
        </Field>

        <Field label="Ingredients (one per line)">
          <textarea value={form.ingredients} onChange={set('ingredients')} rows={5}
            placeholder={"2 cups flour\n1 tsp salt\n..."} className={`${field} resize-none font-mono text-xs`} />
        </Field>

        <Field label="Instructions">
          <textarea value={form.instructions} onChange={set('instructions')} rows={6}
            placeholder="Step-by-step cooking instructions..." className={`${field} resize-none`} />
        </Field>

        <Field label="Image URL (optional)">
          <input value={form.image_url} onChange={set('image_url')} placeholder="https://..." type="url" className={field} />
        </Field>

        <Field label="Recipe source URL (optional)">
          <input value={form.source_url} onChange={set('source_url')} placeholder="https://..." type="url" className={field} />
        </Field>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-colors mt-2">
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add recipe'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
