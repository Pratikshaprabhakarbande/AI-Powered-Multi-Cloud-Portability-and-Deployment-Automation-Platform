/**
 * App — route configuration.
 *  - Public-only routes: login / register / password reset.
 *  - Protected routes: rendered inside the dashboard Layout, gated by JWT
 *    (and role where applicable).
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout/Layout.jsx';
import NotificationArea from './components/layout/NotificationArea.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicOnlyRoute from './routes/PublicOnlyRoute.jsx';
import { ROLES } from './config/roles.js';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Terraform from './pages/Terraform.jsx';
import Security from './pages/Security.jsx';
import AiAdvisor from './pages/AiAdvisor.jsx';
import Compliance from './pages/Compliance.jsx';
import FinOps from './pages/FinOps.jsx';
import Migration from './pages/Migration.jsx';
import Deployments from './pages/Deployments.jsx';
import DeploymentDetail from './pages/DeploymentDetail.jsx';
import Deploy from './pages/Deploy.jsx';
import Monitoring from './pages/Monitoring.jsx';
import Kubernetes from './pages/Kubernetes.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import NotFound from './pages/NotFound.jsx';

const NON_VIEWER = [ROLES.ADMIN, ROLES.CLOUD_ENGINEER, ROLES.DEVOPS_ENGINEER];

export default function App() {
  return (
    <BrowserRouter>
      <NotificationArea />
      <Routes>
        {/* Public-only */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

        {/* Protected app shell */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* All roles */}
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/deployments/:id" element={<DeploymentDetail />} />
          <Route path="/deploy" element={<ProtectedRoute roles={NON_VIEWER}><Deploy /></ProtectedRoute>} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/security" element={<Security />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/finops" element={<FinOps />} />

          {/* Implemented module pages (non-viewer) */}
          <Route path="/terraform" element={<ProtectedRoute roles={NON_VIEWER}><Terraform /></ProtectedRoute>} />
          <Route path="/kubernetes" element={<ProtectedRoute roles={NON_VIEWER}><Kubernetes /></ProtectedRoute>} />
          <Route path="/ai-architect" element={<ProtectedRoute roles={NON_VIEWER}><AiAdvisor /></ProtectedRoute>} />
          <Route path="/migration" element={<ProtectedRoute roles={NON_VIEWER}><Migration /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/admin/users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminUsers /></ProtectedRoute>} />
        </Route>

        {/* Redirects + 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
