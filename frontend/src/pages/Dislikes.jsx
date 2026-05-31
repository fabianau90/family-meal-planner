import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';

function TagSection({ title, color, tags, placeholder, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    setInput('');
    await onAdd(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  const colors = {
    green: {
      banner: 'from-green-400 to-emerald-400',
      tag: 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100',
      btn: 'from-green-500 to-emerald-400 shadow-green-200',
      ring: 'focus:ring-green-300',
    },
    red: {
      banner: 'from-red-400 to-orange-400',
      tag: 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100',
      btn: 'from-red-500 to-orange-400 shadow-red-200',
      ring: 'focus:ring-red-300',
    },
  }[color];

  return (
    <div className="mb-6">
      <div className={`bg-gradient-to-r ${colors.banner} rounded-2xl px-4 py-3 mb-4`}>
        <p className="text-white font-bold text-sm">{title}</p>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(t => (
            <button key={t} onClick={() => onRemove(t)}
              className={`flex items-center gap-1.5 border px-3 py-2 rounded-full text-sm font-medium active:scale-95 transition-all shadow-sm ${colors.tag}`}>
              {t}
              <span className="opacity-50 font-bold leading-none">×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-stone-400 text-sm mb-4">Nothing added yet — type below to add.</p>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${colors.ring} focus:bg-white transition-colors`}
        />
        <button type="submit" disabled={!input.trim()}
          className={`bg-gradient-to-r ${colors.btn} text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-40 transition-all active:scale-95 shadow-sm whitespace-nowrap`}>
          {saved ? '✓' : '+ Add'}
        </button>
      </form>
    </div>
  );
}

export default function Preferences() {
  const { members, refreshMembers } = useFamily();
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (members.length >= 1) setSelected(members[0].id);
  }, [members]);

  useEffect(() => {
    if (!selected) return;
    api.getMember(selected).then(setProfile);
  }, [selected]);

  async function updateField(field, newList) {
    const updated = { ...profile, [field]: newList };
    setProfile(updated);
    await api.updateMember(selected, updated);
    await refreshMembers();
  }

  async function addTo(field, val) {
    if (!profile || profile[field]?.includes(val)) return;
    await updateField(field, [...(profile[field] || []), val]);
  }

  async function removeFrom(field, val) {
    if (!profile) return;
    await updateField(field, (profile[field] || []).filter(v => v !== val));
  }

  return (
    <div className="px-4 py-6">
      <div className="bg-gradient-to-br from-orange-500 to-red-400 rounded-2xl p-5 mb-6 shadow-sm shadow-orange-200">
        <p className="text-orange-100 text-xs font-medium mb-1">Personalising AI suggestions</p>
        <p className="text-white font-bold text-lg">Yvette's Preferences</p>
        <p className="text-orange-100 text-sm mt-1">The AI uses this to suggest meals she'll love.</p>
      </div>

      {profile && (
        <>
          <TagSection
            title="✅ Foods & cuisines she likes"
            color="green"
            tags={[...(profile.likes || [])]}
            placeholder="e.g. pasta, fried chicken, Japanese..."
            onAdd={val => addTo('likes', val)}
            onRemove={val => removeFrom('likes', val)}
          />
          <TagSection
            title="🚫 Foods she dislikes"
            color="red"
            tags={profile.dislikes || []}
            placeholder="e.g. mushrooms, spicy food, coriander..."
            onAdd={val => addTo('dislikes', val)}
            onRemove={val => removeFrom('dislikes', val)}
          />
        </>
      )}
    </div>
  );
}
