import { useMemo } from 'react'
import { buildTechTargets, type TechTargets } from '@/scene/Technology/techTargets'

/**
 * A modest population for the drawn diagrams — these illustrate the platform,
 * they are not a second rendering of it. Built once and shared by all five
 * stages so every diagram is a view of the same arrangement.
 */
const DIAGRAM_NODES = 96

export function useDiagramTargets(): TechTargets {
  return useMemo(() => buildTechTargets(DIAGRAM_NODES), [])
}
