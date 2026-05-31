import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [activeMember, setActiveMember] = useState(() => {
    const saved = localStorage.getItem('activeMemberId');
    return saved || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMembers()
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function selectMember(id) {
    setActiveMember(id);
    localStorage.setItem('activeMemberId', id);
  }

  function clearMember() {
    setActiveMember(null);
    localStorage.removeItem('activeMemberId');
  }

  async function refreshMembers() {
    const data = await api.getMembers();
    setMembers(data);
  }

  const activeProfile = members.find(m => m.id === activeMember) || null;

  return (
    <FamilyContext.Provider value={{ members, activeMember, activeProfile, loading, selectMember, clearMember, refreshMembers }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
