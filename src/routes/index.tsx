import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/routes/admin/layout';
import { CustomerLayout } from '@/routes/customer/layout';
import { LoginPage } from '@/routes/login';
import { TicketsPage } from '@/routes/admin/tickets';
import { AnalyticsPage } from '@/routes/admin/analytics';
import { VouchersPage } from '@/routes/admin/vouchers';
import { CareGuidePage } from '@/routes/admin/care-guide';
import { QrGeneratorPage } from '@/routes/admin/qr-generator';
import { SettingsPage } from '@/routes/admin/settings';
import { HelpPage } from '@/routes/customer/help';
import { MyProductsPage } from '@/routes/customer/my-products';
import { FaqPage } from '@/routes/customer/faq';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/tickets" replace /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'vouchers', element: <VouchersPage /> },
      { path: 'care-guide', element: <CareGuidePage /> },
      { path: 'qr-generator', element: <QrGeneratorPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/help',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <HelpPage /> },
      { path: 'my-products', element: <MyProductsPage /> },
      { path: 'faq', element: <FaqPage /> },
    ],
  },
]);
