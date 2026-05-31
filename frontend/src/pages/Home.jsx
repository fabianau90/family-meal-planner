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
    <div className="px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-1">Hi Yvette!</h1>
        <p className="text-stone-500">Tap your name to get meal ideas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex justify-center">
          {members.map(member => (
            <div key={member.id} className="flex flex-col items-center gap-3">
              <Avatar
                member={member}
                size="lg"
                editable
                onUpload={(base64) => handleUpload(member, base64)}
              />
              <button
                onClick={() => handleSelect(member)}
                className="bg-white border-2 border-stone-100 rounded-2xl px-8 py-3 hover:border-orange-300 hover:shadow-md transition-all active:scale-95"
              >
                <span className="font-semibold text-stone-700 text-lg">{member.name}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
