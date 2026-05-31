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
    if (members.length >= 1) setSelected(members[0].id);
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
      {/* Header banner */}
      <div className="bg-gradient-to-br from-red-400 to-orange-400 rounded-2xl p-5 mb-6 shadow-sm shadow-red-100">
        <p className="text-red-100 text-xs font-medium mb-1">Personalising Yvette's meals</p>
        <p className="text-white font-bold text-lg">Foods to avoid</p>
        <p className="text-red-100 text-sm mt-1">AI will mostly avoid these, but occasionally sneak one in to encourage trying new things 😄</p>
      </div>

      {profile && (
        <>
          {profile.dislikes?.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.dislikes.map(d => (
                <button key={d} onClick={() => removeDislike(d)}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-full text-sm font-medium hover:bg-red-100 active:scale-95 transition-all shadow-sm">
                  {d}
                  <span className="text-red-300 font-bold leading-none">×</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🍽</div>
              <p className="text-stone-500 text-sm">No dislikes added yet.</p>
              <p className="text-stone-400 text-xs mt-1">Add foods below that Yvette doesn't like.</p>
            </div>
          )}

          <form onSubmit={addDislike} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. mushrooms, spicy food..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || saving}
              className="bg-gradient-to-r from-orange-500 to-red-400 text-white px-5 py-3 rounded-2xl font-semibold hover:shadow-md disabled:opacity-40 transition-all active:scale-95 shadow-sm shadow-orange-200"
            >
              {saved ? '✓' : 'Add'}
            </button>
          </form>
          <p className="text-xs text-stone-400 mt-2 text-center">Tap any tag above to remove it</p>
        </>
      )}
    </div>
  );
}
