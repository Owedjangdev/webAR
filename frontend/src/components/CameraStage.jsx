import { useEffect, useRef } from 'react'
import { CameraOff } from 'lucide-react'

/**
 * Aperçu du flux caméra avec, en surimpression, les infos du lieu.
 * Premier rendu vidéo de la semaine 1 (le rendu AR viendra plus tard).
 */
export default function CameraStage({ stream, place, config, onStop }) {
  const videoRef = useRef(null)

  // Branche le flux sur l'élément <video> une fois celui-ci monté.
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="overflow-hidden rounded-3xl bg-black shadow-xl ring-1 ring-slate-200">
      <div className="relative aspect-[3/4]">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        {/* Bandeau infos lieu en haut. */}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 text-white">
          <h1 className="text-lg font-bold">{place.name}</h1>
          <p className="text-sm text-white/80">{place.city}</p>
        </div>

        {config?.message && (
          <p className="absolute inset-x-4 bottom-20 rounded-xl bg-black/40 px-4 py-2 text-center text-sm text-white">
            {config.message}
          </p>
        )}

        <button
          type="button"
          onClick={onStop}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg"
        >
          <CameraOff className="h-4 w-4" />
          Arrêter la caméra
        </button>
      </div>
    </div>
  )
}
