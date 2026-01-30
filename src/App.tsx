import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
// Import pages lazily or directly. For now placeholders.
import { Dashboard } from './pages/Dashboard';
import { AuditList } from './pages/AuditList';
import { Import } from './pages/Import';
import { Reports } from './pages/Reports';
import { AdminUsers } from './pages/AdminUsers';

import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="audit" element={<AuditList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="import" element={<Import />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
