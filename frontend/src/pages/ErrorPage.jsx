import ErrorScreen from '../components/ErrorScreen.jsx'

/**
 * Route d'erreur (ex. URL inconnue) : réutilise l'écran d'erreur au thème.
 */
export default function ErrorPage({ message }) {
  return <ErrorScreen message={message} />
}
