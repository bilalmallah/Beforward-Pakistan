import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/Login/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import UsersPage from '../pages/Users/UsersPage';
import TeamsPage from '../pages/Teams/TeamsPage';
import CustomersPage from '../pages/Customers/CustomersPage';
import CustomerProfilePage from '../pages/Customers/CustomerProfile/CustomerProfilePage';
import InboxPage from '../pages/Inbox/InboxPage';
import TemplatesPage from '../pages/Templates/TemplatesPage';
import VehiclesPage from '../pages/Vehicles/VehiclesPage';
import CampaignsPage from '../pages/Campaigns/CampaignsPage';
import TicketsPage from '../pages/Tickets/TicketsPage';
import FollowUpsPage from '../pages/FollowUps/FollowUpsPage';
import AnalyticsPage from '../pages/Analytics/AnalyticsPage';
import WhatsAppHealthPage from '../pages/WhatsAppHealth/WhatsAppHealthPage';
import { CAN_MANAGE_USERS, CAN_MANAGE_TEAMS } from '../constants/roles';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerProfilePage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route
          path="/templates"
          element={
            <ProtectedRoute allowedRoles={CAN_MANAGE_USERS}>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute allowedRoles={CAN_MANAGE_USERS}>
              <CampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route
          path="/whatsapp-health"
          element={
            <ProtectedRoute allowedRoles={CAN_MANAGE_USERS}>
              <WhatsAppHealthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={CAN_MANAGE_USERS}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute allowedRoles={CAN_MANAGE_TEAMS}>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
