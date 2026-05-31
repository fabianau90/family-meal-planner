import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';

export default function Home() {
  const { members, loading, selectMember } = useFamily();
  const navigate = useNavigate();

  function handleSelect(member) {
    selectMember(member.id);
    navigate('/suggest');
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
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className="flex flex-col items-center gap-3 bg-white border-2 border-stone-100 rounded-2xl p-8 hover:border-orange-300 hover:shadow-md transition-all active:scale-95"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-sm"
                style={{ backgroundColor: member.avatar_color }}
              >
                {member.name[0].toUpperCase()}
              </div>
              <span className="font-semibold text-stone-700 text-lg text-center leading-tight">
                {member.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
