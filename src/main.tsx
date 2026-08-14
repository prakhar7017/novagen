import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import './styles/globals.css'
import App from './app/App'

// Register GSAP plugins once at the module level
gsap.registerPlugin(ScrollTrigger, useGSAP)

// Dev-only handles for the verification scripts in scripts/
if (import.meta.env.DEV) {
  Object.assign(window, { gsap, ScrollTrigger })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
