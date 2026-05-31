import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useFamily } from '../context/FamilyContext';
import WebViewer from '../components/WebViewer';

export default function Suggest() {
  const { members } = useFamily();
  const [selectedIds, setSelectedIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('ai');
  const [viewerUrl, setViewerUrl] = useState(null);
  const bottomRef = useRef(null);

  // Auto-select all members (just Yvette)
  useEffect(() => {
    if (members.length) setSelectedIds(members.map(m => m.id));
  }, [members]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    if (mode === 'ai') {
      setMessages(prev => [...prev, { role: 'user', text }]);
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
    } else {
      setMessages(prev => [...prev, { role: 'user', text: `🔍 ${text}` }]);
      setLoading(true);
      try {
        const res = await api.searchRecipes(text);
        setMessages(prev => [...prev, { role: 'search', results: res.results }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Search failed: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-stone-600 font-medium mb-1">What shall we eat?</p>
            <p className="text-stone-400 text-sm mb-6">Ask for meal ideas, or switch to 🔍 to search recipes online.</p>
            <div className="flex flex-col gap-2">
              {['Suggest 3 dinners for tonight', 'What should we make this weekend?', 'Quick and easy meal ideas'].map(q => (
                <button key={q} onClick={() => { setMode('ai'); setInput(q); }}
                  className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-2.5 text-sm hover:bg-orange-100 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'search') {
            return (
              <div key={i} className="space-y-2">
                {msg.results.length === 0
                  ? <p className="text-sm text-stone-400 text-center">No results found.</p>
                  : msg.results.map((r, j) => (
                    <button key={j} onClick={() => setViewerUrl(r.url)}
                      className="w-full text-left bg-white border border-stone-200 rounded-xl p-3 hover:border-orange-300 transition-colors">
                      <p className="text-sm font-medium text-stone-800 line-clamp-1">{r.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{r.snippet}</p>
                    </button>
                  ))
                }
              </div>
            );
          }
          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-stone-100 text-stone-800 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

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

      <WebViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />

      {/* Single input bar */}
      <div className="px-4 py-3 border-t border-stone-100 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode(m => m === 'ai' ? 'search' : 'ai')}
            className={`px-3 py-3 rounded-xl text-lg transition-colors flex-shrink-0 ${mode === 'ai' ? 'bg-orange-100 text-orange-500' : 'bg-stone-100 text-stone-500'}`}
            title={mode === 'ai' ? 'Switch to web search' : 'Switch to AI suggestions'}
          >
            {mode === 'ai' ? '✨' : '🔍'}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'ai' ? 'Ask for meal ideas...' : 'Search recipes online...'}
            disabled={loading}
            className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-orange-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
