import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Map,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { useConversations } from '@/hooks/useMessages';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/directory', label: 'Directory', icon: Users },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { unreadTotal } = useConversations();

  return (
    <>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-gold-subtle text-brand-gold border-l-2 border-brand-gold'
                : 'text-brand-navy-light hover:bg-gray-100'
            }`
          }
        >
          <Icon size={18} />
          <span>{label}</span>
          {label === 'Messages' && unreadTotal > 0 && (
            <Badge className="ml-auto h-5 min-w-[20px] flex items-center justify-center bg-brand-gold text-brand-navy text-xs px-1">
              {unreadTotal}
            </Badge>
          )}
        </NavLink>
      ))}
    </>
  );
}

export function AppShell() {
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = profile?.name
    ? profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-brand-navy-light font-bold text-lg tracking-tight">
            MIT <span className="text-brand-gold">Nexus</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItems />
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-brand-navy-light text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-navy-light truncate">
              {profile?.name ?? 'Loading…'}
            </p>
            <p className="text-xs text-gray-500 truncate">{profile?.email ?? ''}</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <span className="text-brand-navy-light font-bold text-lg tracking-tight">
          MIT <span className="text-brand-gold">Nexus</span>
        </span>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg text-brand-navy-light hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white flex flex-col shadow-xl">
            <div className="px-6 py-5 border-b border-gray-100 mt-14">
              {/* spacer for top bar */}
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              <NavItems onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-brand-navy-light text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-navy-light truncate">
                  {profile?.name ?? 'Loading…'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
