import { useCallback, useEffect, useState } from 'react'

/**
 * Charge une ressource API et expose { data, loading, error, reload }.
 * Factorise le schéma fetch + états (chargement / erreur) réutilisé par toutes
 * les pages du backoffice (DRY, §18).
 *
 * @param {() => Promise<any>} fetcher - fonction de chargement STABLE
 *   (à envelopper dans un useCallback côté appelant).
 */
export function useApiResource(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [version, setVersion] = useState(0)

  // Force un rechargement (ex. après création / publication).
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let active = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fetcher()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((err) => active && setState({ data: null, loading: false, error: err.message }))
    return () => {
      active = false
    }
  }, [fetcher, version])

  return { ...state, reload }
}
