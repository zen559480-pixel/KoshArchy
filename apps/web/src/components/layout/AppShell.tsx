import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChart,
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Wallet,
  RefreshCcw,
  BarChart3,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { logout, getStoredUser } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { GlobalQuickAdd } from './GlobalQuickAdd';

// ─── Nav item definition ──────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/',              icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',      icon: Wallet },
  { label: 'Transactions', href: '/transactions',  icon: ArrowLeftRight },
  { label: 'Goals',        href: '/goals',         icon: Target },
  { label: 'Budget',       href: '/budget',        icon: PieChart },
  { label: 'Analytics',    href: '/analytics',     icon: BarChart3 },
  { label: 'Recurring',    href: '/recurring',     icon: RefreshCcw },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

const MOBILE_PRIMARY_NAV: NavItem[] = [
  { label: 'Home',         href: '/',              icon: LayoutDashboard },
  { label: 'Accounts',     href: '/accounts',      icon: Wallet },
  { label: 'Txns',         href: '/transactions',  icon: ArrowLeftRight },
  { label: 'Budget',       href: '/budget',        icon: PieChart },
  { label: 'Goals',        href: '/goals',         icon: Target },
];

// ─── Single nav link ──────────────────────────────────────────────
function SideNavLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      end={item.href === '/'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-brand-50 dark:bg-red-950/40 text-brand-700 dark:text-red-400 font-bold dark:border-r-2 dark:border-red-500'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161620] hover:text-slate-900 dark:hover:text-slate-200'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'w-5 h-5 shrink-0 transition-colors',
              isActive
                ? 'text-brand-600 dark:text-red-400'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-brand-100 text-brand-700 dark:bg-red-950/60 dark:text-red-400">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const user = getStoredUser();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0c0c10]">
      {/* Logo + Theme Toggle */}
      <div className="flex items-center justify-between px-4 py-5 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black border border-red-500/30 flex items-center justify-center shadow-md shadow-red-950/20 shrink-0 overflow-hidden">
            <img src="/logo-icon.png" alt="KoshArchy Emblem" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              KoshArchy
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {formatDate(new Date())}
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181824] transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-3 border-t border-slate-100 dark:border-[#1e1e28]" />

      {/* Main navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SideNavLink key={item.href} item={item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom navigation (Settings) */}
      <div className="px-3 py-2 space-y-1">
        {BOTTOM_NAV.map((item) => (
          <SideNavLink key={item.href} item={item} onClick={onNavClick} />
        ))}

        {/* Divider */}
        <div className="mx-0 my-3 border-t border-slate-100 dark:border-[#1e1e28]" />

        {/* User + Logout */}
        <div className="pb-4">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-[#14141c] border border-transparent dark:border-[#222230]">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shrink-0 shadow-sm shadow-red-950/40">
              <span className="text-xs font-bold text-white">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
            {/* Logout button */}
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────
export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070709] overflow-hidden text-slate-900 dark:text-slate-100">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-[#1a1a24] bg-white dark:bg-[#0c0c10]">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#0c0c10] border-r border-slate-200 dark:border-[#1a1a24] shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181824] transition-colors z-10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#070709]">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0c0c10] border-b border-slate-200 dark:border-[#1a1a24] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181824] transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black border border-red-500/30 flex items-center justify-center shadow-xs overflow-hidden">
                <img src="/logo-icon.png" alt="KoshArchy Emblem" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">KoshArchy</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181824] transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <ChevronRight className="w-3 h-3" />
              <span className="capitalize font-medium">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable page content with bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 bg-slate-50 dark:bg-[#070709]">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 xl:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#1a1a24] flex items-center justify-around py-1.5 px-2">
          {MOBILE_PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors',
                  isActive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Global Floating Action Button for Quick Add Transaction */}
        <GlobalQuickAdd />
      </div>
    </div>
  );
}

