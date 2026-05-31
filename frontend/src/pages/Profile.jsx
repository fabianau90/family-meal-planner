import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';

const CUISINES = ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'American', 'Thai', 'Japanese', 'Greek', 'French'];
const DIETARY = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free', 'Halal', 'Kosher', 'Low-carb'];

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshMembers } = useFamily();
  const [member, setMember] = useState(null);
  const [form, setForm] = useState({ name: '', avatar_color: '#f97316', cuisines: [], dietary_restrictions: [], dislikes: [] });
  const [dislikeInput, setDislikeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getMember(id).then(m => {
      setMember(m);
      setForm({
        name: m.name,
        avatar_color: m.avatar_color,
        cuisines: m.cuisines || [],
        dietary_restrictions: m.dietary_restrictions || [],
        dislikes: m.dislikes || [],
      });
    });
  }, [id]);

  function toggleArray(field, value) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter(x => x !== value) : [...f[field], value],
    }));
  }

  function addDislike(e) {
    e.preventDefault();
    const val = dislikeInput.trim();
    if (val && !form.dislikes.includes(val)) {
      setForm(f => ({ ...f, dislikes: [...f.dislikes, val] }));
    }
    setDislikeInput('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateMember(id, form);
      await refreshMembers();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!member) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="px-4 py-6 pb-8">
      <button onClick={() => navigate(-1)} className="text-orange-500 text-sm font-medium mb-4 flex items-center gap-1">
        ← Back
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow"
          style={{ backgroundColor: form.avatar_color }}>
          {form.name[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{form.name}</h1>
          <p className="text-stone-500 text-sm">Edit preferences</p>
        </div>
      </div>

      <Section title="Favourite cuisines">
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => (
            <Chip key={c} active={form.cuisines.includes(c)} onClick={() => toggleArray('cuisines', c)}>{c}</Chip>
          ))}
        </div>
      </Section>

      <Section title="Dietary requirements">
        <div className="flex flex-wrap gap-2">
          {DIETARY.map(d => (
            <Chip key={d} active={form.dietary_restrictions.includes(d)} onClick={() => toggleArray('dietary_restrictions', d)}>{d}</Chip>
          ))}
        </div>
      </Section>

      <Section title="Dislikes / allergies">
        <div className="flex flex-wrap gap-2 mb-3">
          {form.dislikes.map(d => (
            <button key={d} onClick={() => setForm(f => ({ ...f, dislikes: f.dislikes.filter(x => x !== d) }))}
              className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 hover:bg-red-200">
              {d} ×
            </button>
          ))}
        </div>
        <form onSubmit={addDislike} className="flex gap-2">
          <input
            value={dislikeInput}
            onChange={e => setDislikeInput(e.target.value)}
            placeholder="e.g. mushrooms, peanuts..."
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button type="submit" className="bg-stone-100 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-200">Add</button>
        </form>
      </Section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl mt-4 hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save preferences'}
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-stone-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'}`}>
      {children}
    </button>
  );
}
