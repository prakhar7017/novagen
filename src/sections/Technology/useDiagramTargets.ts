import { useMemo } from 'react'
import { buildTechTargets, type TechTargets } from '@/scene/Technology/techTargets'

const DIAGRAM_NODES = 96

export function useDiagramTargets(): TechTargets {
  return useMemo(() => buildTechTargets(DIAGRAM_NODES), [])
}
