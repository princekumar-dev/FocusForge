import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ListTodo, Target, BarChart3, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarSound } from '@/hooks/useAvatarSound';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/focus', icon: Target, label: 'Focus' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { playAvatarSound } = useAvatarSound();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isProfileTab = item.path === '/profile';
          
          const handleNav = () => {
            if (isProfileTab && profile?.avatar) {
              playAvatarSound(profile.avatar);
            } else {
              playAvatarSound('tap');
            }
            navigate(item.path);
          };

          return (
            <button
              key={item.path}
              onClick={handleNav}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 active:scale-90 ${
                isActive
                  ? 'text-primary scale-110'
                  : 'text-muted-foreground/60 hover:text-foreground hover:scale-105'
              }`}
            >
              {isProfileTab && profile?.avatar ? (
                <span className="text-lg leading-none transition-transform">{profile.avatar}</span>
              ) : (
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} />
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40 font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
}
