import { Home, Plus, Settings } from 'lucide-react';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useGroup } from '../contexts/GroupContext';

interface Props {
  children: React.ReactNode;
  /** Override header title */
  title?: string;
  /** Extra content in header right slot */
  headerRight?: React.ReactNode;
  /** Hide bottom nav (e.g. on modals) */
  hideNav?: boolean;
}

export const Layout: React.FC<Props> = ({
  children,
  title,
  headerRight,
  hideNav,
}) => {
  const { currentGroup, groups, setCurrentGroupId } = useGroup();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 pt-safe">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">🏠</span>
            {title ? (
              <h1 className="font-bold text-gray-800 truncate">{title}</h1>
            ) : (
              /* Group switcher */
              <select
                className="font-bold text-gray-800 bg-transparent border-none outline-none max-w-[160px] truncate"
                value={currentGroup?.id ?? ''}
                onChange={(e) => setCurrentGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 mb-nav">{children}</main>

      {/* Bottom navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe">
          <div className="flex items-center h-14">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors
                 ${isActive ? 'text-primary-500' : 'text-gray-400'}`
              }
            >
              <Home size={22} />
              <span className="text-[10px] font-semibold">ホーム</span>
            </NavLink>

            {/* Center FAB */}
            <div className="flex-none px-6">
              <button
                onClick={() => navigate('/item/new')}
                className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center
                           shadow-lg shadow-primary-500/40 active:scale-90 transition-transform"
              >
                <Plus size={24} />
              </button>
            </div>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors
                 ${isActive ? 'text-primary-500' : 'text-gray-400'}`
              }
            >
              <Settings size={22} />
              <span className="text-[10px] font-semibold">設定</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};
