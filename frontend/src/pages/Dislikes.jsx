import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';

export default function Dislikes() {
  const { members, refreshMembers } = useFamily();
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (members.length === 1) setSelected(members[0].id);
  }, [members]);

  useEffect(() => {
    if (!selected) return;
    api.getMember(selected).then(setProfile);
  }, [selected]);

  async function addDislike(e) {
    e.preventDefault();
    const val = input.trim();
    if (!val || !profile) return;
    if (profile.dislikes?.includes(val)) { setInput(''); return; }
    const updated = { ...profile, dislikes: [...(profile.dislikes || []), val] };
    setProfile(updated);
    setInput('');
    setSaving(true);
    try {
      await api.updateMember(selected, updated);
      await refreshMembers();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function removeDislike(val) {
    const updated = { ...profile, dislikes: profile.dislikes.filter(d => d !== val) };
    setProfile(updated);
    await api.updateMember(selected, updated);
    await refreshMembers();
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Food Dislikes</h1>
      <p className="text-stone-500 text-sm mb-6">The AI will avoid these when suggesting meals.</p>

      {profile && (
        <>
          {/* Current dislikes */}
          <div className="mb-6">
            {profile.dislikes?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.dislikes.map(d => (
                  <button key={d} onClick={() => removeDislike(d)}
                    className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-sm hover:bg-red-100 transition-colors">
                    {d}
                    <span className="text-red-400 font-bold text-xs">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 text-sm">No dislikes added yet.</p>
            )}
          </div>

          {/* Add new dislike */}
          <form onSubmit={addDislike} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. mushrooms, coriander, spicy food..."
              className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              autoFocus
            />
            <button type="submit" disabled={!input.trim() || saving}
              className="bg-orange-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors">
              {saved ? '✓' : 'Add'}
            </button>
          </form>
          <p className="text-xs text-stone-400 mt-2">Tap any item above to remove it.</p>
        </>
      )}
    </div>
  );
}
