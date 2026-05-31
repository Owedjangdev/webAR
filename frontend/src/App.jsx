import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import ErrorPage from './pages/ErrorPage.jsx'
import ExperiencePage from './pages/ExperiencePage.jsx'

/**
 * Composant racine de l'application : définit le routing.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la racine vers la page expérience. */}
        <Route path="/" element={<Navigate to="/webar" replace />} />
        {/* Page visiteur : lit ?id= dans l'URL (ex. /webar?id=exp_001). */}
        <Route path="/webar" element={<ExperiencePage />} />
        {/* Toute autre route -> page d'erreur. */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
