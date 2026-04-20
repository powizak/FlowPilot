import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import ProjectDetail from '../pages/ProjectDetail';
import Tasks from '../pages/Tasks';
import { TimePage as Time } from '../features/time/TimePage';
import { ReportsPage as Reports } from '../features/reports/ReportsPage';
import { SettingsPage as Settings } from '../features/settings/SettingsPage';
import { CalendarView } from '../features/calendar/CalendarView';
import { ClientsPage } from '../features/clients/ClientsPage';
import { ClientDetail } from '../features/clients/ClientDetail';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { InvoiceForm } from '../features/invoices/InvoiceForm';
import { InvoiceDetail } from '../features/invoices/InvoiceDetail';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'clients',
        element: <ClientsPage />,
      },
      {
        path: 'clients/:id',
        element: <ClientDetail />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'projects/:id',
        element: <ProjectDetail />,
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'invoices',
        element: <InvoicesPage />,
      },
      {
        path: 'invoices/new',
        element: <InvoiceForm />,
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetail />,
      },
      {
        path: 'invoices/:id/edit',
        element: <InvoiceForm />,
      },
      {
        path: 'time',
        element: <Time />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'calendar',
        element: <CalendarView />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
