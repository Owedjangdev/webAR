import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AdminLayout from './backoffice/AdminLayout.jsx'
import ProtectedRoute from './backoffice/ProtectedRoute.jsx'
import AssetsPage from './backoffice/pages/AssetsPage.jsx'
import DashboardPage from './backoffice/pages/DashboardPage.jsx'
import ExperiencesPage from './backoffice/pages/ExperiencesPage.jsx'
import LoginPage from './backoffice/pages/LoginPage.jsx'
import PlacesPage from './backoffice/pages/PlacesPage.jsx'
import QrGenerationPage from './backoffice/pages/QrGenerationPage.jsx'
import SettingsPage from './backoffice/pages/SettingsPage.jsx'
import ErrorPage from './pages/ErrorPage.jsx'
import ExperiencePage from './pages/ExperiencePage.jsx'

/**
 * Composant racine de l'application : définit le routing.
 * - Visiteur : `/webar?id=...` (expérience AR).
 * - Backoffice admin : `/admin/*` (login public + sous-routes protégées).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la racine vers la page expérience. */}
        <Route path="/" element={<Navigate to="/webar" replace />} />
        {/* Page visiteur : lit ?id= dans l'URL (ex. /webar?id=exp_001). */}
        <Route path="/webar" element={<ExperiencePage />} />

        {/* Backoffice administrateur. */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="places" element={<PlacesPage />} />
          <Route path="experiences" element={<ExperiencesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="qr" element={<QrGenerationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Toute autre route -> page d'erreur. */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
