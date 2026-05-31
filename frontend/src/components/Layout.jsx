import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {

  const navItem = 'flex flex-col items-center gap-0.5 text-xs font-medium text-stone-500 hover:text-orange-500 transition-colors';
  const activeClass = 'text-orange-500';

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-sm">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-xl font-bold text-orange-500 tracking-tight">
          🍽 Tao Kah Chiu
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-stone-100 flex justify-around items-center py-3 px-4 z-10">
        <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
          <span className="text-xl">🏠</span>
          Home
        </NavLink>
        <NavLink to="/suggest" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
          <span className="text-xl">✨</span>
          Suggest
        </NavLink>
        <NavLink to="/recipes" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
          <span className="text-xl">📖</span>
          Recipes
        </NavLink>
        <NavLink to="/planner" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
          <span className="text-xl">📅</span>
          Planner
        </NavLink>
        <NavLink to="/shopping" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
          <span className="text-xl">🛒</span>
          Shopping
        </NavLink>
        <NavLink to="/dislikes" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
          <span className="text-xl">🚫</span>
          Dislikes
        </NavLink>
      </nav>
    </div>
  );
}
