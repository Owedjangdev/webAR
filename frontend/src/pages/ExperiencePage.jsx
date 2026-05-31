import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import ErrorScreen from '../components/ErrorScreen.jsx'
import ExperienceScreen from '../components/ExperienceScreen.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { fetchExperience } from '../lib/api.js'

// États de chargement de l'expérience.
const LoadState = { LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }

/**
 * Page visiteur principale.
 * Lit l'identifiant dans l'URL (ex. /webar?id=exp_001), charge l'expérience
 * depuis l'API, puis affiche l'écran adapté : chargement, expérience ou erreur.
 */
export default function ExperiencePage() {
  const [searchParams] = useSearchParams()
  const experienceId = searchParams.get('id')

  const [state, setState] = useState(LoadState.LOADING)
  const [experience, setExperience] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!experienceId) {
      setErrorMessage("Aucun identifiant d'expérience dans l'URL (ex. /webar?id=exp_001).")
      setState(LoadState.ERROR)
      return
    }

    let cancelled = false
    setState(LoadState.LOADING)

    fetchExperience(experienceId)
      .then((data) => {
        if (cancelled) return
        setExperience(data)
        setState(LoadState.SUCCESS)
      })
      .catch((error) => {
        if (cancelled) return
        setErrorMessage(error.message)
        setState(LoadState.ERROR)
      })

    return () => {
      cancelled = true
    }
  }, [experienceId])

  if (state === LoadState.LOADING) {
    return <LoadingScreen />
  }
  if (state === LoadState.ERROR) {
    return <ErrorScreen message={errorMessage} />
  }
  return <ExperienceScreen experience={experience} />
}
