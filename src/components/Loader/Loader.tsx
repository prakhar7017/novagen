import { useEffect, useLayoutEffect, useState } from 'react'
import clsx from 'clsx'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'

const CRITICAL_IMAGE = '/assets/story/01-organism.webp'

const MIN_MS = 960
const MAX_MS = 1400

const EXIT_MS = 760
const EXIT_REDUCED_MS = 280

function waitForCriticalAssets(): Promise<void> {
  const image = new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = CRITICAL_IMAGE
    if (img.complete) resolve()
  })

  const fonts =
    'fonts' in document
      ? document.fonts.ready.then(() => undefined).catch(() => undefined)
      : Promise.resolve()

  const cap = new Promise<void>((resolve) => window.setTimeout(resolve, MAX_MS))

  return Promise.race([Promise.all([image, fonts]).then(() => undefined), cap])
}

export default function Loader() {
  const reduced = useReducedMotion()
  const setBooted = useExperienceStore((s) => s.setBooted)

  const [ready, setReady] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const started = performance.now()
    let cancelled = false

    waitForCriticalAssets().then(() => {
      if (cancelled) return
      const remaining = Math.max(0, MIN_MS - (performance.now() - started))
      window.setTimeout(() => !cancelled && setReady(true), remaining)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    if (!ready) return
    setBooted(true)
    const timer = window.setTimeout(
      () => setGone(true),
      reduced ? EXIT_REDUCED_MS : EXIT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [ready, reduced, setBooted])

  if (gone) return null

  return (
    <div
      className={clsx('site-loader', ready && 'is-leaving')}
      role="status"
      aria-live="polite"
    >
      <div className="site-loader-mark" aria-hidden="true">
        <span className="site-loader-ring" />
        <span className="site-loader-ring site-loader-ring--wave" />
        <span className="site-loader-seed" />
      </div>

      <div className="site-loader-word">
        NOVA<span aria-hidden="true">/</span>GEN
      </div>

      <p className="site-loader-meta">Initializing biological system</p>
    </div>
  )
}
