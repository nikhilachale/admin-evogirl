import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Ticket,
  BarChart3,
  Gift,
  BookOpen,
  QrCode,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/logo';

const NAV = [
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/vouchers', label: 'Vouchers', icon: Gift },
  { to: '/admin/care-guide', label: 'Care Guide Editor', icon: BookOpen },
  { to: '/admin/qr-generator', label: 'QR Card Generator', icon: QrCode },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col gap-1 border-r border-brand-gold/10 bg-gradient-to-b from-brand-purple-darkest to-[#15081F] p-3 pt-5 transition-[width] duration-300',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      <div
        className={cn(
          'mb-6 flex items-center',
          collapsed && 'justify-center',
        )}
      >
        {collapsed ? (
          <Logo variant="mark" />
        ) : (
          <div className="flex flex-col">
            <Logo variant="dark" />
            <span className="mt-1 px-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand-gold/55">
              Admin Console
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute right-2 top-4 flex h-6 w-6 items-center justify-center rounded-md border border-brand-gold/25 bg-brand-gold/10 text-brand-gold/80 transition-colors hover:bg-brand-gold/20"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[12.5px] font-semibold text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/90',
                isActive &&
                  'bg-gradient-to-r from-brand-gold/15 to-brand-gold/[0.04] text-brand-gold-light',
                collapsed && 'justify-center px-0',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className={cn(
                      'absolute top-2 bottom-2 w-[3px] rounded-r bg-gradient-to-b from-brand-gold-light to-brand-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]',
                      collapsed ? '-left-3' : 'left-0',
                    )}
                  />
                )}
                <Icon size={16} className="flex-shrink-0" />
                <span
                  className={cn(
                    'whitespace-nowrap transition-opacity',
                    collapsed && 'sr-only',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
