import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import ErrorScreen from '../components/ErrorScreen.jsx'
import ExperienceScreen from '../components/ExperienceScreen.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { fetchExperience, trackScan } from '../lib/api.js'

const MISSING_ID_MESSAGE =
  "Aucun identifiant d'expérience dans l'URL (ex. /webar?id=exp_001)."

/**
 * Page visiteur principale.
 * Lit l'identifiant dans l'URL (ex. /webar?id=exp_001), charge l'expérience
 * depuis l'API, puis affiche l'écran adapté : chargement, expérience ou erreur.
 *
 * Le résultat est mémorisé avec l'id auquel il correspond : tant que ce résultat
 * ne concerne pas l'id courant, on affiche le chargement. Les états « pas d'id »
 * et « chargement » sont ainsi dérivés du rendu, sans setState synchrone dans
 * l'effet (cf. « You Might Not Need an Effect », doc React).
 */
export default function ExperiencePage() {
  const [searchParams] = useSearchParams()
  const experienceId = searchParams.get('id')

  // { id, experience } en cas de succès, { id, error } en cas d'échec.
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!experienceId) return undefined

    let cancelled = false
    fetchExperience(experienceId)
      .then((experience) => {
        if (cancelled) return
        setResult({ id: experienceId, experience })
        // Scan compté une fois l'expérience chargée avec succès (= ouverture via QR).
        trackScan(experienceId)
      })
      .catch((error) => {
        if (!cancelled) setResult({ id: experienceId, error: error.message })
      })

    return () => {
      cancelled = true
    }
  }, [experienceId])

  if (!experienceId) {
    return <ErrorScreen message={MISSING_ID_MESSAGE} />
  }
  // Pas encore de résultat, ou résultat d'un id précédent : on charge.
  if (!result || result.id !== experienceId) {
    return <LoadingScreen />
  }
  if (result.error) {
    return <ErrorScreen message={result.error} />
  }
  return <ExperienceScreen experience={result.experience} />
}
