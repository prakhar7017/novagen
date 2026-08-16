export interface StudyMeta {
  key: string
  value: string
}

export interface ResearchStudy {
  id: string
  index: string
  title: readonly string[]
  summary: string
  meta: readonly StudyMeta[]
  image?: {
    src: string
    srcNarrow: string
    width: number
    height: number
    alt: string
  }
}

export interface ResearchAnnotation {
  x: number
  y: number
  label: string
  value: string
  side: 'left' | 'right'
}
