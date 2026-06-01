import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { api } from '../lib/api';
import Avatar from '../components/Avatar';

export default function Home() {
  const { members, loading, selectMember, refreshMembers } = useFamily();
  const navigate = useNavigate();

  function handleSelect(member) {
    selectMember(member.id);
    navigate('/suggest');
  }

  async function handleUpload(member, base64) {
    await api.updateMember(member.id, { ...member, avatar_url: base64 });
    await refreshMembers();
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
      {/* Hero */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-400 p-8 text-center mb-8 shadow-lg shadow-orange-200">
        <p className="text-orange-100 text-sm font-medium mb-1">Good to see you</p>
        <h1 className="text-4xl font-bold text-white mb-1">Hi Yvette! 👋</h1>
        <p className="text-orange-100 text-sm">What shall we eat today?</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full">
          {members.map(member => (
            <div key={member.id} className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar
                  member={member}
                  size="lg"
                  editable
                  onUpload={(base64) => handleUpload(member, base64)}
                />
              </div>
              <button
                onClick={() => handleSelect(member)}
                className="bg-gradient-to-r from-orange-500 to-red-400 text-white font-bold text-lg px-12 py-4 rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-105 active:scale-95 transition-all"
              >
                Let's eat! 🍴
              </button>
            </div>
          ))}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            {[
              { emoji: '✨', label: 'Get suggestions', to: '/suggest' },
              { emoji: '📖', label: 'Browse recipes', to: '/recipes' },
              { emoji: '📅', label: 'This week', to: '/planner' },
              { emoji: '🛒', label: 'Shopping list', to: '/shopping' },
            ].map(({ emoji, label, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center gap-3 bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm hover:border-orange-200 hover:shadow-md transition-all active:scale-95"
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-medium text-stone-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
