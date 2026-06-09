import * as THREE from 'three'

// Scène 3D PROCÉDURALE (aucun modèle à charger) : un objet facetté lumineux,
// enveloppé d'un halo en fil de fer et d'un nuage de particules, le tout à la
// couleur d'accent (config.color). Pensée pour rester légère sur mobile faible :
// géométrie low-poly, peu de particules, pixelRatio plafonné.

const PARTICLE_COUNT = 140

/**
 * Monte la scène sur un canvas transparent et lance la boucle d'animation.
 *
 * @param {HTMLCanvasElement} canvas - canvas cible (transparent, par-dessus la caméra)
 * @param {{ color?: string }} [options]
 * @returns {{ dispose: () => void }} - appeler dispose() au démontage (nettoyage GPU)
 */
export function createObjectScene(canvas, { color = '#10B981' } = {}) {
  const accent = new THREE.Color(color)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true, // fond transparent → la vidéo caméra reste visible derrière
    antialias: true,
    preserveDrawingBuffer: true, // nécessaire pour inclure le rendu 3D dans la capture
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 5

  // Objet central facetté (basse résolution = léger).
  const coreGeometry = new THREE.IcosahedronGeometry(1.25, 1)
  const core = new THREE.Mesh(
    coreGeometry,
    new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.45,
      metalness: 0.3,
      roughness: 0.35,
      flatShading: true,
    }),
  )

  // Halo en fil de fer qui tourne en sens inverse (effet « énergie »).
  const wireGeometry = new THREE.IcosahedronGeometry(1.7, 1)
  const wire = new THREE.Mesh(
    wireGeometry,
    new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.25 }),
  )
  scene.add(core, wire)

  // Nuage de particules réparti sur une sphère autour de l'objet.
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const radius = 2.5 + Math.random() * 2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)
  }
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: accent, size: 0.06, transparent: true, opacity: 0.8 }),
  )
  scene.add(particles)

  // Lumières : ambiante douce + une lampe à la couleur d'accent pour les reliefs.
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const keyLight = new THREE.PointLight(accent, 1.2, 50)
  keyLight.position.set(3, 3, 4)
  scene.add(keyLight)

  // Adapte la taille du rendu au canvas (réactif aux rotations / resize).
  const resize = () => {
    const width = canvas.clientWidth || 1
    const height = canvas.clientHeight || 1
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  // Boucle d'animation : rotation, flottement, particules.
  let frame = 0
  const clock = new THREE.Clock()
  const animate = () => {
    const t = clock.getElapsedTime()
    core.rotation.set(t * 0.4, t * 0.55, 0)
    core.position.y = Math.sin(t * 1.2) * 0.15
    wire.rotation.set(-t * 0.25, -t * 0.3, 0)
    particles.rotation.y = t * 0.08
    renderer.render(scene, camera)
    frame = requestAnimationFrame(animate)
  }
  animate()

  return {
    dispose() {
      cancelAnimationFrame(frame)
      observer.disconnect()
      coreGeometry.dispose()
      core.material.dispose()
      wireGeometry.dispose()
      wire.material.dispose()
      particleGeometry.dispose()
      particles.material.dispose()
      renderer.dispose()
      renderer.forceContextLoss?.()
    },
  }
}
