import { useCallback, useEffect, useRef, useState } from 'react'

// États possibles de la caméra (rendu + fallbacks, cf. CLAUDE.md section 11).
export const CameraStatus = {
  IDLE: 'idle', // pas encore démarrée
  ACTIVE: 'active', // flux vidéo en cours
  DENIED: 'denied', // permission refusée par l'utilisateur
  UNAVAILABLE: 'unavailable', // getUserMedia absent (navigateur/contexte non sécurisé)
}

/**
 * Hook d'accès à la caméra via getUserMedia.
 *
 * Expose le flux (`stream`) à brancher sur un <video>, le statut courant, et
 * les fonctions start/stop. Gère les fallbacks : API absente, permission refusée.
 */
export function useCamera() {
  const streamRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState(CameraStatus.IDLE)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setStatus(CameraStatus.IDLE)
  }, [])

  const start = useCallback(async () => {
    // getUserMedia n'existe pas hors contexte sécurisé (HTTPS / localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(CameraStatus.UNAVAILABLE)
      return
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // caméra frontale (selfie)
        audio: false,
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setStatus(CameraStatus.ACTIVE)
    } catch {
      setStatus(CameraStatus.DENIED)
    }
  }, [])

  // Libère la caméra quand le composant est démonté.
  useEffect(() => stop, [stop])

  return { status, stream, start, stop }
}
