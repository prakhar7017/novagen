import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useExperienceStore } from '@/store/experienceStore'

export default function SceneWarmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const technologyArmed = useExperienceStore((s) => s.technologyStage !== null)
  const impactArmed = useExperienceStore((s) => s.impactStage !== null)
  const ctaArmed = useExperienceStore((s) => s.ctaArmed)

  useEffect(() => {
    const request =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = request(() => gl.compile(scene, camera), { timeout: 300 })
    return () => cancel(handle as number)
  }, [gl, scene, camera, technologyArmed, impactArmed, ctaArmed])

  return null
}
