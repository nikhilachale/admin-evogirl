import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

function navClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'text-sm font-semibold transition-colors',
    isActive
      ? 'text-primary'
      : 'text-muted-foreground hover:text-foreground',
  );
}

export function CustomerLayout() {
  return (
    <div className="theme-light min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <nav
          className="mx-auto flex max-w-2xl items-center justify-center gap-8 px-6 py-4"
          aria-label="Help site"
        >
          <NavLink to="/help" end className={navClassName}>
            Help
          </NavLink>
          <NavLink to="/help/faq" className={navClassName}>
            FAQ
          </NavLink>
          <NavLink to="/help/my-products" className={navClassName}>
            My products
          </NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
