import { useEffect, useLayoutEffect, useState } from 'react'
import clsx from 'clsx'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'

/** The one image the first screen cannot be drawn without (§17). */
const CRITICAL_IMAGE = '/assets/story/01-organism.webp'

/**
 * Long enough that the mark is read rather than glimpsed, short enough that it
 * is never the reason anyone waits. §14 asks for 500–1400ms; the floor is set
 * just past the end of the intro keyframes below so the sequence is never cut
 * off mid-fade by the handover, and the cap bounds the asset wait.
 */
const MIN_MS = 960
const MAX_MS = 1400

/** Kept in step with the exit keyframes in loader.css. */
const EXIT_MS = 760
const EXIT_REDUCED_MS = 280

/**
 * Wait for the things the Hero actually needs, and never for anything else.
 *
 * §17 is explicit that Research images, the Impact photograph and the rest of
 * the library must not hold the loader — so this waits on exactly two: the
 * fonts, because the Hero headline is 70px of type and swapping it after the
 * fact is a visible reflow, and the organism, because it *is* the first
 * screen. Every wait is also raced against a timeout: a failed decode or a
 * font stack that never resolves must not trap anyone behind a cover (§53).
 */
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

/**
 * The loading experience (§14–§17).
 *
 * A signal point, a membrane rippling outward from it, the wordmark, and then
 * the whole thing opening into the Hero. It is the site's first sentence in
 * miniature — a single biological point becoming something structured — and it
 * is the same shape the Final CTA closes on.
 *
 * The animation is CSS rather than GSAP, and that is a performance decision
 * rather than a stylistic one. This is the one moment on the page where the
 * main thread is genuinely busy: React is mounting the whole document, the
 * WebGL context is initialising and every shader is being compiled behind the
 * cover. A JS-driven tween shares that thread and stutters visibly; keyframes
 * on nothing but `transform` and `opacity` run on the compositor and hold a
 * steady 60fps straight through it. Everything here animates one of those two
 * properties — no `stroke-dashoffset`, no `box-shadow` growth, no layout.
 *
 * No percentage is shown. §15 rules out a fake one, and a real one for two
 * assets would spend most of its life at 50%.
 */
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
      // Held to the floor rather than released the instant the cache answers:
      // on a warm load everything resolves in 30ms and the cover would flash.
      const remaining = Math.max(0, MIN_MS - (performance.now() - started))
      window.setTimeout(() => !cancelled && setReady(true), remaining)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // ── The handover (§16) ───────────────────────────────────────────────────
  // `booted` is set as the cover *starts* opening rather than after it has
  // gone, so the Hero's own entrance is already underway behind it and the two
  // read as one movement rather than as a handoff. The unmount is on a timer
  // matched to the keyframes rather than on `animationend`, because a cover
  // that outlives a dropped event is a cover nobody can scroll past.
  //
  // Layout rather than passive, so the store write lands in the same frame as
  // the class that starts the cover opening. As a passive effect it ran after
  // the paint, and the Hero's entrance began one frame behind the movement it
  // is supposed to be continuing.
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
        {/* Two rings rather than one: the first is the membrane closing around
            the point, the second is the wave that carries on past it. A single
            ring reads as a container; two read as something forming. */}
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
