import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useExperienceStore } from '@/store/experienceStore'

/**
 * Compiles each scene's materials at the moment it arms, rather than at the
 * moment it is first drawn.
 *
 * Three builds a program the first time an object actually reaches the
 * renderer, so the sixteen programs on this page were being linked *during* the
 * scroll that revealed them — a compile lands as a long frame at the exact
 * moment a section is fading in, which is the worst possible place for one.
 *
 * The obvious fix, compiling everything once at boot, does not work here:
 * Technology, Impact and the closing cell deliberately mount nothing until they
 * arm (§51, §52), so at boot there is nothing to compile. Arming happens a full
 * viewport before a section is visible, which is the opening this uses. Each
 * time a stage arms, `compile()` is run over the whole graph on the next idle
 * slot — with a timeout, because during a scroll idle slots are scarce and this
 * needs to land well inside that viewport of runway. Materials already
 * compiled hit the program cache, so re-running it costs nothing.
 */
export default function SceneWarmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  // Booleans rather than the stage ids themselves: a section's materials do not
  // change as it steps between arrangements, so only the arm/disarm edge is
  // worth recompiling on.
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
