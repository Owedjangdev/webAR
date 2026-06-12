import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AdminLayout from './backoffice/AdminLayout.jsx'
import ProtectedRoute from './backoffice/ProtectedRoute.jsx'
import AssetsPage from './backoffice/pages/AssetsPage.jsx'
import DashboardPage from './backoffice/pages/DashboardPage.jsx'
import ExperiencesPage from './backoffice/pages/ExperiencesPage.jsx'
import LoginPage from './backoffice/pages/LoginPage.jsx'
import PartnersPage from './backoffice/pages/PartnersPage.jsx'
import PlacesPage from './backoffice/pages/PlacesPage.jsx'
import QrGenerationPage from './backoffice/pages/QrGenerationPage.jsx'
import SettingsPage from './backoffice/pages/SettingsPage.jsx'
import PartnerLayout from './partner/PartnerLayout.jsx'
import PartnerDashboardPage from './partner/pages/PartnerDashboardPage.jsx'
import PartnerPlacesPage from './partner/pages/PartnerPlacesPage.jsx'
import PartnerQrPage from './partner/pages/PartnerQrPage.jsx'
import PartnerStatsPage from './partner/pages/PartnerStatsPage.jsx'
import ErrorPage from './pages/ErrorPage.jsx'
import ExperiencePage from './pages/ExperiencePage.jsx'

/**
 * Composant racine de l'application : définit le routing.
 * - Visiteur : `/webar?id=...` (expérience AR).
 * - Backoffice admin : `/admin/*` (login public + sous-routes protégées).
 * - Espace partenaire : `/partner/*` (même login, rôle 'partner', lecture seule).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la racine vers la page expérience. */}
        <Route path="/" element={<Navigate to="/webar" replace />} />
        {/* Page visiteur : lit ?id= dans l'URL (ex. /webar?id=exp_001). */}
        <Route path="/webar" element={<ExperiencePage />} />

        {/* Connexion partagée (admin + partenaire). */}
        <Route path="/login" element={<LoginPage />} />
        {/* Ancienne URL conservée : redirige vers la connexion partagée. */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Backoffice administrateur. */}
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
          <Route path="partners" element={<PartnersPage />} />
          <Route path="experiences" element={<ExperiencesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="qr" element={<QrGenerationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Espace partenaire (rôle 'partner', lecture seule). */}
        <Route
          path="/partner"
          element={
            <ProtectedRoute role="partner">
              <PartnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboardPage />} />
          <Route path="places" element={<PartnerPlacesPage />} />
          <Route path="qr" element={<PartnerQrPage />} />
          <Route path="stats" element={<PartnerStatsPage />} />
        </Route>

        {/* Toute autre route -> page d'erreur. */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
