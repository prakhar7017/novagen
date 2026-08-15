import { Suspense, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import PlatformField from './PlatformField'
import SampleSpecimen from './SampleSpecimen'
import ConfidenceRings from './ConfidenceRings'
import ValidationCandidate from './ValidationCandidate'
import { buildTechTargets } from './techTargets'
import { techVisible } from '@/sections/Technology/technology.constants'
import { useExperienceStore } from '@/store/experienceStore'

interface Props {
  nodeCount: number
  /** The composition shifts right so the copy column keeps quiet background */
  offsetVisual: boolean
}

/**
 * Everything the Technology section draws into the shared canvas.
 *
 * One group, one node population, five arrangements — §60 rules out a canvas or
 * a scene per stage, and the narrative depends on it anyway: the map has to be
 * visibly the same material as the sample.
 *
 * The group's visibility is a pure function of scroll, so the platform costs
 * nothing while the other sections are on screen, and the two textures are not
 * even requested until the section is roughly one viewport away.
 */
export default function TechnologyScene({ nodeCount, offsetVisual }: Props) {
  const viewport = useThree((s) => s.viewport)
  const stage = useExperienceStore((s) => s.technologyStage)

  const targets = useMemo(() => buildTechTargets(nodeCount), [nodeCount])

  // The arrangements are authored in fixed world units against a frame roughly
  // 7.5 units wide (see FRAME in techTargets). Scaling the group to the actual
  // frustum keeps the composition identical at every viewport instead of
  // letting it crop; the ceiling stops it inflating on ultrawide screens.
  const fit = useMemo(
    () => Math.max(0.52, Math.min(1.18, viewport.width / 7.5)),
    [viewport.width],
  )

  // Right-biased, and lifted a little: the stage copy sits bottom-left and the
  // pipeline runs along the bottom edge (§9, §44).
  const position = useMemo<[number, number, number]>(
    () => [offsetVisual ? viewport.width * 0.155 : 0, viewport.height * 0.045, 0],
    [offsetVisual, viewport.width, viewport.height],
  )

  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    if (group.current) group.current.visible = techVisible()
  })

  // Nothing mounts until the section arms itself, and the validated candidate
  // waits until a shortlist exists — so its texture is fetched during the
  // middle of the section rather than with the page (ASSET_MANIFEST §15).
  if (!stage) return null
  const shortlisted = stage === 'predict' || stage === 'validate'

  return (
    <group ref={group} position={position} scale={fit} visible={false}>
      <Suspense fallback={null}>
        <SampleSpecimen />
      </Suspense>

      <PlatformField targets={targets} />
      <ConfidenceRings targets={targets} />

      {shortlisted && (
        <Suspense fallback={null}>
          <ValidationCandidate />
        </Suspense>
      )}
    </group>
  )
}
