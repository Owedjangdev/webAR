import { useEffect, useState } from 'react'

import { gravatarUrl, initialsFromEmail } from '../../lib/identity.js'

/**
 * Avatar du compte connecté : tente la photo Gravatar liée à l'email, et retombe
 * sur les initiales (sur fond brand) si l'email n'a pas de photo (404) ou si le
 * chargement échoue. Aucune dépendance backend : tout part de l'email.
 *
 * @param {object} props
 * @param {string} [props.email] - email du compte (source de la photo + initiales).
 *
 * Monter le composant avec `key={email}` : si l'email change, le composant est
 * remonté à neuf (état `failed`/`url` réinitialisé) sans setState dans l'effet.
 */
export default function Avatar({ email }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!email) return undefined
    let active = true
    gravatarUrl(email)
      .then((resolved) => active && setUrl(resolved))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [email])

  const base = 'h-9 w-9 shrink-0 rounded-full'

  if (email && url && !failed) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className={`${base} object-cover`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`${base} flex items-center justify-center bg-brand-600/20 text-sm font-bold text-brand-400`}
    >
      {initialsFromEmail(email)}
    </span>
  )
}
