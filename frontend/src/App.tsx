import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import DocumentPage from './pages/DocumentPage';
import { PublicationPage } from './pages/PublicationPage';
import { PublicationHistoriesPage } from './pages/PublicationHistoriesPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDocumentsPage } from './pages/admin/AdminDocumentsPage';
import { AdminUploadPage } from './pages/admin/AdminUploadPage';
import { AdminStatisticsPage } from './pages/admin/AdminStatisticsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPublicationsPage } from './pages/admin/AdminPublicationsPage';
import { AdminPublicationEditPage } from './pages/admin/AdminPublicationEditPage';
import { AdminHelpPage } from './pages/admin/AdminHelpPage';
import { LoginPage } from './pages/admin/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/document/:id" element={<DocumentPage />} />
          <Route path="/publication/:id" element={<PublicationPage />} />
          <Route path="/histories" element={<PublicationHistoriesPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDocumentsPage />} />
            <Route path="documents" element={<AdminDocumentsPage />} />
            <Route path="upload" element={<AdminUploadPage />} />
            <Route path="statistics" element={<AdminStatisticsPage />} />
            <Route path="publications" element={
              <AdminRoute>
                <AdminPublicationsPage />
              </AdminRoute>
            } />
            <Route path="publications/:id" element={
              <AdminRoute>
                <AdminPublicationEditPage />
              </AdminRoute>
            } />
            <Route path="users" element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            } />
            <Route path="help" element={<AdminHelpPage />} />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
