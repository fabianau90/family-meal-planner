import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { api } from '../lib/api';

const AVATAR_COLORS = [
  '#f97316', '#ef4444', '#a855f7', '#3b82f6',
  '#10b981', '#f59e0b', '#ec4899', '#6366f1',
];

export default function Home() {
  const { members, loading, selectMember, refreshMembers } = useFamily();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    try {
      await api.createMember({ name: newName.trim(), avatar_color: newColor });
      await refreshMembers();
      setNewName('');
      setNewColor(AVATAR_COLORS[0]);
      setShowAdd(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  function handleSelect(member) {
    selectMember(member.id);
    navigate('/suggest');
  }

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-1">Who's eating today?</h1>
        <p className="text-stone-500">Pick your name to get personalised meal ideas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className="flex flex-col items-center gap-3 bg-white border-2 border-stone-100 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all active:scale-95"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                style={{ backgroundColor: member.avatar_color }}
              >
                {member.name[0].toUpperCase()}
              </div>
              <span className="font-semibold text-stone-700 text-center leading-tight">
                {member.name}
              </span>
            </button>
          ))}

          {/* Add member card */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center gap-3 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-5 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-3xl">
              +
            </div>
            <span className="font-semibold text-stone-400 text-center">Add member</span>
          </button>
        </div>
      )}

      {/* Add member modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-20 px-4 pb-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Add family member</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Mum, Dad, Lily..."
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`w-9 h-9 rounded-full transition-transform ${newColor === color ? 'scale-125 ring-2 ring-offset-2 ring-stone-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !newName.trim()}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
