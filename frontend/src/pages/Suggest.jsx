import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';

export default function Suggest() {
  const { members, activeMember, selectMember } = useFamily();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(activeMember ? [activeMember] : []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function toggleMember(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function sendMessage(text) {
    if (!selectedIds.length) return;
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.suggestMeals({ member_ids: selectedIds, message: text, history });
      setHistory(res.history);
      setMessages(prev => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await api.searchRecipes(searchQuery);
      setSearchResults(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Member selector */}
      <div className="px-4 py-3 border-b border-stone-100 bg-orange-50">
        <p className="text-xs font-medium text-stone-500 mb-2">Who's eating?</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => toggleMember(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${selectedIds.includes(m.id) ? 'text-white border-transparent' : 'bg-white text-stone-600 border-stone-200'}`}
              style={selectedIds.includes(m.id) ? { backgroundColor: m.avatar_color } : {}}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: m.avatar_color }}>
                {m.name[0]}
              </span>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-stone-600 font-medium mb-1">AI Meal Suggestions</p>
            <p className="text-stone-400 text-sm">Select family members above, then ask for meal ideas or tap a suggestion below.</p>
            <div className="flex flex-col gap-2 mt-6">
              {['Suggest 3 dinners for tonight', 'What should we make this weekend?', 'Quick and easy meal ideas'].map(q => (
                <button key={q} onClick={() => sendMessage(q)} disabled={!selectedIds.length}
                  className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-2.5 text-sm hover:bg-orange-100 disabled:opacity-40 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-sm'
                : 'bg-stone-100 text-stone-800 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Web search */}
      <div className="px-4 py-2 border-t border-stone-100 bg-stone-50">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recipes online..."
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button type="submit" disabled={searching} className="bg-stone-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-300 disabled:opacity-50">
            {searching ? '...' : '🔍'}
          </button>
        </form>
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="block bg-white border border-stone-200 rounded-xl p-3 hover:border-orange-300 transition-colors">
                <p className="text-sm font-medium text-stone-800 line-clamp-1">{r.title}</p>
                <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{r.snippet}</p>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-stone-100 bg-white">
        <form onSubmit={e => { e.preventDefault(); if (input.trim()) sendMessage(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={selectedIds.length ? 'Ask for meal ideas...' : 'Select family members first'}
            disabled={!selectedIds.length || loading}
            className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-stone-50"
          />
          <button type="submit" disabled={!input.trim() || !selectedIds.length || loading}
            className="bg-orange-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
