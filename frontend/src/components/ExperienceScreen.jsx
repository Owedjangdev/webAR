import { useState } from 'react'

import { CameraStatus, useCamera } from '../hooks/useCamera.js'
import CameraPermissionCard from './CameraPermissionCard.jsx'
import CameraStage from './CameraStage.jsx'
import NoCameraCard from './NoCameraCard.jsx'
import ScreenLayout from './ScreenLayout.jsx'

/**
 * Écran d'affichage de l'expérience.
 * Orchestre les 3 vues : demande caméra, flux caméra actif, mode sans caméra.
 */
export default function ExperienceScreen({ experience }) {
  const { status, stream, start, stop } = useCamera()
  const [withoutCamera, setWithoutCamera] = useState(false)
  const { place, config } = experience

  let content
  if (status === CameraStatus.ACTIVE) {
    content = <CameraStage stream={stream} place={place} config={config} onStop={stop} />
  } else if (withoutCamera) {
    content = (
      <NoCameraCard experience={experience} onEnableCamera={() => setWithoutCamera(false)} />
    )
  } else {
    content = (
      <CameraPermissionCard
        place={place}
        status={status}
        onAllow={start}
        onContinueWithout={() => setWithoutCamera(true)}
      />
    )
  }

  return <ScreenLayout>{content}</ScreenLayout>
}
