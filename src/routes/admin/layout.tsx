import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/store/auth';

export function AdminLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
