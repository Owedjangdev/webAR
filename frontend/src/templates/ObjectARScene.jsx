import { useEffect, useRef } from 'react'

/** Détecte le support WebGL (three.js en a besoin) sans rien instancier de lourd. */
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    // Libère le contexte de test : il ne sert qu'à la détection.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * Couche 3D procédurale (three.js) rendue par-dessus la caméra.
 *
 * three.js est chargé en LAZY (import dynamique de lib/objectScene) → il ne pèse
 * QUE sur ce template, jamais sur le bundle principal des autres expériences.
 * Si WebGL est absent ou si le chargement échoue, on ne rend rien d'actif et on
 * prévient le parent (onStatusChange) : le reste du template marche sans la 3D.
 *
 * @param {string}   color          - couleur d'accent (config.color)
 * @param {object}   canvasRef      - ref vers le <canvas> (partagée pour la capture)
 * @param {function} onStatusChange - reçoit 'active' | 'unsupported'
 */
export default function ObjectARScene({ color, canvasRef, onStatusChange }) {
  const localRef = useRef(null)
  const ref = canvasRef ?? localRef

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !hasWebGL()) {
      onStatusChange?.('unsupported')
      return undefined
    }

    let active = true
    let scene = null
    import('../lib/objectScene.js')
      .then(({ createObjectScene }) => {
        if (!active) return
        scene = createObjectScene(canvas, { color })
        onStatusChange?.('active')
      })
      .catch(() => {
        if (active) onStatusChange?.('unsupported')
      })

    return () => {
      active = false
      scene?.dispose()
    }
  }, [ref, color, onStatusChange])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" />
}
