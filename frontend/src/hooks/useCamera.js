import { useCallback, useEffect, useRef, useState } from 'react'

// États possibles de la caméra (rendu + fallbacks, cf. CLAUDE.md section 11).
export const CameraStatus = {
  IDLE: 'idle', // pas encore démarrée
  ACTIVE: 'active', // flux vidéo en cours
  DENIED: 'denied', // permission refusée par l'utilisateur
  UNAVAILABLE: 'unavailable', // getUserMedia absent (navigateur/contexte non sécurisé)
}

// Orientation de la caméra (valeurs getUserMedia facingMode).
export const FacingMode = {
  FRONT: 'user', // caméra frontale (selfie)
  BACK: 'environment', // caméra arrière
}

/**
 * Hook d'accès à la caméra via getUserMedia.
 *
 * Expose le flux (`stream`) à brancher sur un <video>, le statut, l'orientation
 * courante, et les fonctions start/stop/flip. Gère les fallbacks : API absente,
 * permission refusée.
 */
export function useCamera() {
  const streamRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState(CameraStatus.IDLE)
  const [facingMode, setFacingMode] = useState(FacingMode.FRONT)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setStatus(CameraStatus.IDLE)
  }, [])

  const start = useCallback(async (mode = FacingMode.FRONT) => {
    // getUserMedia n'existe pas hors contexte sécurisé (HTTPS / localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(CameraStatus.UNAVAILABLE)
      return
    }
    // Libère le flux précédent (utile lors d'un changement de caméra).
    streamRef.current?.getTracks().forEach((track) => track.stop())
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setFacingMode(mode)
      setStatus(CameraStatus.ACTIVE)
    } catch {
      setStatus(CameraStatus.DENIED)
    }
  }, [])

  // Bascule entre caméra frontale et arrière (relance le flux).
  const flip = useCallback(() => {
    start(facingMode === FacingMode.FRONT ? FacingMode.BACK : FacingMode.FRONT)
  }, [facingMode, start])

  // Libère la caméra quand le composant est démonté.
  useEffect(() => stop, [stop])

  return { status, stream, facingMode, start, stop, flip }
}
