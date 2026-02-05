import { Home, LayoutDashboard, Settings, HelpCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', active: false },
  { icon: LayoutDashboard, label: 'Tasks', active: true },
  { icon: Star, label: 'Favorites', active: false },
  { icon: Settings, label: 'Settings', active: false },
  { icon: HelpCircle, label: 'Help & Support', active: false },
];

export function AppSidebar() {
  return (
    <aside className="w-64 gradient-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaskFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all",
                  item.active && "bg-white/20 text-white font-medium"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User</p>
            <p className="text-xs text-white/60">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
