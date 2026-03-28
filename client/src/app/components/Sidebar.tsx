import { Home, Library, CreditCard, BarChart3, Languages, Settings, BookText, BookMarked, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { LayoutGroup, motion } from 'motion/react';
import logoImage from '../../assets/6b7cb55c909914121ea017ad0c44450d479e791f.png';
import { useUser } from '../contexts/UserContext';
import { AuthModal } from './AuthModal';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useUser();
  const [authOpen, setAuthOpen] = useState(false);

  const navItems: NavItem[] = [
    { icon: Home, label: 'Trang Chủ', path: '/' },
    { icon: Library, label: 'Thư Viện', path: '/library' },
    { icon: CreditCard, label: 'Flashcards', path: '/flashcards' },
    { icon: BookText, label: 'Bài Đọc', path: '/reading' },
    { icon: BookMarked, label: 'Từ Vựng', path: '/vocabulary' },
    { icon: BarChart3, label: 'Thống Kê', path: '/statistics' },
    { icon: Languages, label: 'Dịch Thuật', path: '/translation' },
    { icon: Settings, label: 'Cài Đặt', path: '/settings' },
  ];

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <aside className="w-20 lg:w-64 bg-white dark:bg-gray-900 border-r border-border dark:border-gray-800 flex flex-col items-center lg:items-stretch py-6 px-3 lg:px-5 gap-2">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logoImage} alt="OpenLang Logo" className="w-12 h-12 lg:w-20 lg:h-20 object-contain" />
          <h1 className="text-base lg:text-xl font-bold">
            <span className="text-purple-600 dark:text-purple-500">Open</span>
            <span className="text-purple-300 dark:text-purple-400">Lang</span>
          </h1>
        </div>

        {/* Nav */}
        <LayoutGroup>
          <nav className="flex flex-col gap-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex items-center gap-4 px-4 py-3 rounded-2xl overflow-hidden
                    ${isActive
                      ? 'text-white shadow-lg shadow-purple-200 dark:shadow-purple-900'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
                    }
                    justify-center lg:justify-start
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      transition={{ type: 'spring', stiffness: 480, damping: 36, mass: 0.7 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-4">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* ── Bottom box: User Profile OR Login Button ── */}
        {isLoggedIn && user ? (
          <button
            onClick={() => navigate('/settings')}
            title={user.name}
            className="mt-2 w-full flex items-center gap-3 px-3 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700 transition-all group justify-center lg:justify-start"
          >
            {/* Avatar */}
            <div className="flex-none relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-purple-300 dark:border-purple-600 group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors bg-purple-100"
              />
              {/* Online dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white dark:border-gray-900" />
            </div>

            {/* Name + email — only on wide sidebar */}
            <div className="hidden lg:flex flex-col items-start min-w-0 flex-1">
              <span className="font-semibold text-gray-800 dark:text-gray-100 truncate w-full text-sm leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full leading-tight">
                {user.email}
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            title="Đăng Nhập"
            className="mt-2 w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all group justify-center lg:justify-start"
          >
            <div className="flex-none w-9 h-9 rounded-full bg-gradient-to-br from-purple-200 to-violet-300 dark:from-purple-800 dark:to-violet-800 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="hidden lg:flex flex-col items-start min-w-0 flex-1">
              <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm leading-tight">
                Đăng Nhập
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                Để lưu tiến độ học
              </span>
            </div>
          </button>
        )}
      </aside>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
