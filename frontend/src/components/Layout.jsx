import { Outlet, NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Home', emoji: '🏠', end: true },
  { to: '/suggest', label: 'Suggest', emoji: '✨' },
  { to: '/recipes', label: 'Recipes', emoji: '📖' },
  { to: '/planner', label: 'Planner', emoji: '📅' },
  { to: '/shopping', label: 'Shop', emoji: '🛒' },
  { to: '/dislikes', label: 'Prefs', emoji: '⭐' },
];

export default function Layout() {
  const location = useLocation();

  const pageTitle = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))?.label || '';

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-xl shadow-orange-100/50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-orange-100 px-5 py-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest leading-none mb-0.5">Tao Kah Chiu</p>
          <h1 className="text-lg font-bold text-stone-800 leading-none">{pageTitle}</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-sm">
          🍽
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-lg shadow-stone-200/80 border border-stone-100 flex justify-around items-center px-2 py-2">
          {NAV.map(({ to, label, emoji, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all text-xs font-medium min-w-0 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                    : 'text-stone-400 hover:text-orange-400'
                }`
              }
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
