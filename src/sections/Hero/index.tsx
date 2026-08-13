import Experience from '@/scene/Experience'

const NAV_LINKS = ['Platform', 'Research', 'Pipeline', 'Company']

export default function Hero() {
  return (
    <section
      style={{ background: 'var(--color-bg)' }}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* WebGL canvas — fills the section, organism sits right-of-center */}
      <div className="absolute inset-0">
        <Experience />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-10 pt-8">
        {/* Logo */}
        <div className="flex items-baseline gap-1">
          <span
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text)' }}
            className="text-lg font-semibold tracking-widest"
          >
            NOVA
          </span>
          <span style={{ color: 'var(--color-primary)' }} className="text-lg font-light">
            /
          </span>
          <span
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text)' }}
            className="text-lg font-light tracking-widest"
          >
            GEN
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}
              className="text-sm tracking-wider transition-colors duration-200 hover:text-white"
            >
              {link}
            </a>
          ))}
        </nav>

        <a
          href="#"
          style={{
            fontFamily: 'var(--font-sans)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-primary)',
          }}
          className="hidden md:block text-xs tracking-widest px-5 py-2.5 rounded-full
                     transition-colors duration-200 hover:bg-[var(--color-primary-dim)]"
        >
          REQUEST ACCESS
        </a>
      </header>

      {/* ── Hero copy — left column ─────────────────────────────────────── */}
      <div className="relative z-10 flex h-full flex-col justify-center px-10 pb-24 max-w-[520px]">
        {/* Stage label */}
        <div className="flex items-center gap-3 mb-10">
          <span
            style={{ background: 'var(--color-primary)', borderRadius: '50%' }}
            className="w-1.5 h-1.5 inline-block"
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-primary)',
              fontSize: '10px',
            }}
            className="tracking-[0.2em] uppercase"
          >
            01 / ORIGIN — ORGANISM
          </span>
        </div>

        {/* Main heading */}
        <h1
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text)', lineHeight: 1.0 }}
          className="text-6xl font-bold tracking-tight mb-6"
        >
          ENGINEERING
          <br />
          <span style={{ color: 'var(--color-primary)' }}>BIOLOGY</span>
          <br />
          BEYOND LIMITS
        </h1>

        {/* Tagline */}
        <p
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}
          className="text-base leading-relaxed mb-10 max-w-sm"
        >
          We decode living biological systems through programmable chemistry
          to transform human health.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            style={{
              fontFamily: 'var(--font-sans)',
              background: 'var(--color-primary)',
              color: '#060e09',
            }}
            className="text-sm font-semibold tracking-widest px-7 py-3.5 rounded-full
                       transition-opacity duration-200 hover:opacity-90"
          >
            EXPLORE PLATFORM
          </a>
          <a
            href="#"
            style={{
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
            className="text-sm tracking-widest px-7 py-3.5 rounded-full
                       transition-colors duration-200 hover:text-white"
          >
            VIEW RESEARCH
          </a>
        </div>

        {/* Bottom data strip */}
        <div
          className="flex gap-8 mt-16"
          style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}
        >
          {[
            { value: '2.4B', label: 'Cells analysed' },
            { value: '98.4%', label: 'Signal confidence' },
            { value: '14×', label: 'Faster discovery' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}
                className="text-xl font-medium tracking-tight"
              >
                {value}
              </div>
              <div
                style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}
                className="text-xs tracking-wider mt-0.5"
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll indicator ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-8 right-10 z-10 flex flex-col items-center gap-2"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <span
          style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
          className="tracking-[0.2em] uppercase rotate-90 origin-center translate-y-6"
        >
          SCROLL
        </span>
        <div
          style={{ width: '1px', height: '48px', background: 'var(--color-border)' }}
          className="mt-8"
        />
      </div>
    </section>
  )
}
