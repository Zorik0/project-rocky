'use client'

import { motion, useAnimationControls, type Transition } from 'framer-motion'
import { useEffect, useRef } from 'react'

export type AvatarState = 'idle' | 'listening' | 'speaking'

interface RockyAvatarProps {
  state: AvatarState
  size?: number
}

/* ─── Leg geometry ─────────────────────────────────────────────────────── */
// Five legs, evenly spaced around the pentagon. Each leg has two segments.
const LEG_COUNT = 5
const legs = Array.from({ length: LEG_COUNT }, (_, i) => {
  const angleDeg = -90 + i * 72          // start at top, go clockwise
  const rad = (angleDeg * Math.PI) / 180
  const hip = { x: Math.cos(rad) * 42, y: Math.sin(rad) * 42 }
  const knee = { x: Math.cos(rad) * 72, y: Math.sin(rad) * 72 + 8 }
  const foot = { x: Math.cos(rad) * 96, y: Math.sin(rad) * 96 + 18 }
  return { hip, knee, foot, angleDeg }
})

/* ─── Pentagon path ────────────────────────────────────────────────────── */
function pentagonPath(r: number): string {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180)
    return `${Math.cos(a) * r},${Math.sin(a) * r}`
  })
  return `M ${pts.join(' L ')} Z`
}

/* ─── Soundwave ring ──────────────────────────────────────────────────── */
function SoundWave({ delay, r }: { delay: number; r: number }) {
  return (
    <motion.circle
      cx={0}
      cy={0}
      r={r}
      fill="none"
      stroke="var(--color-eridian)"
      strokeWidth={1.2}
      initial={{ opacity: 0.7, scale: 0.6 }}
      animate={{ opacity: 0, scale: 1.8 }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeOut' }}
      style={{ originX: '50%', originY: '50%' }}
    />
  )
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function RockyAvatar({ state, size = 200 }: RockyAvatarProps) {
  const bodyCtrl = useAnimationControls()
  const glowCtrl = useAnimationControls()
  const prevState = useRef<AvatarState>('idle')

  useEffect(() => {
    prevState.current = state

    if (state === 'idle') {
      bodyCtrl.start({
        y: [0, -4, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      })
      glowCtrl.start({ opacity: 0, transition: { duration: 0.4 } })
    }

    if (state === 'listening') {
      bodyCtrl.start({
        scale: [1, 1.04, 1],
        transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      })
      glowCtrl.start({
        opacity: [0.3, 0.65, 0.3],
        transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      })
    }

    if (state === 'speaking') {
      bodyCtrl.start({
        rotate: [0, 1.5, -1.5, 0],
        transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
      })
      glowCtrl.start({ opacity: 0, transition: { duration: 0.3 } })
    }
  }, [state, bodyCtrl, glowCtrl])

  const vb = 240
  const half = vb / 2

  return (
    <div style={{ width: size, height: size }} className="relative select-none">
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        width={size}
        height={size}
        aria-label="Rocky — Eridian engineer"
        overflow="visible"
      >
        <defs>
          {/* Rocky body gradient — dark mineral texture */}
          <radialGradient id="carapace-grad" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#3a3530" />
            <stop offset="55%"  stopColor="#1c1a17" />
            <stop offset="100%" stopColor="#0d0c0a" />
          </radialGradient>

          {/* Mercury joint gradient */}
          <radialGradient id="mercury-grad" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#d4c8b0" />
            <stop offset="60%"  stopColor="#9a8a72" />
            <stop offset="100%" stopColor="#5a5040" />
          </radialGradient>

          {/* Listening glow */}
          <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#c8b89a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#c8b89a" stopOpacity="0" />
          </radialGradient>

          {/* Crack texture filter */}
          <filter id="rocky-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" />
          </filter>
        </defs>

        <g transform={`translate(${half},${half})`}>
          {/* ── Glow halo (listening) ─────────────────────── */}
          <motion.ellipse
            cx={0} cy={0} rx={80} ry={80}
            fill="url(#glow-grad)"
            animate={glowCtrl}
            initial={{ opacity: 0 }}
          />

          {/* ── Sound waves (speaking) ───────────────────── */}
          {state === 'speaking' && (
            <g>
              <SoundWave r={52} delay={0} />
              <SoundWave r={52} delay={0.45} />
              <SoundWave r={52} delay={0.9} />
              <SoundWave r={70} delay={0.2} />
              <SoundWave r={70} delay={0.65} />
            </g>
          )}

          {/* ── Legs ─────────────────────────────────────── */}
          {legs.map((leg, i) => {
            const tapTransition: Transition = state === 'speaking'
              ? {
                  duration: 0.45 + (i % 3) * 0.12,
                  delay: i * 0.09,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : { duration: 0.5 }
            const tapAnim = state === 'speaking'
              ? { y: [0, -6, 0], transition: tapTransition }
              : { y: 0, transition: tapTransition }

            return (
              <motion.g key={i} animate={tapAnim}>
                {/* Upper segment */}
                <line
                  x1={leg.hip.x} y1={leg.hip.y}
                  x2={leg.knee.x} y2={leg.knee.y}
                  stroke="url(#mercury-grad)"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                />
                {/* Lower segment */}
                <line
                  x1={leg.knee.x} y1={leg.knee.y}
                  x2={leg.foot.x} y2={leg.foot.y}
                  stroke="#2e2a24"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
                {/* Mercury joint sphere */}
                <circle
                  cx={leg.knee.x} cy={leg.knee.y} r={5}
                  fill="url(#mercury-grad)"
                />
                {/* Hip socket */}
                <circle
                  cx={leg.hip.x} cy={leg.hip.y} r={3.5}
                  fill="#c8b89a"
                  opacity={0.7}
                />
              </motion.g>
            )
          })}

          {/* ── Carapace (body) ───────────────────────────── */}
          <motion.g animate={bodyCtrl} initial={{ y: 0 }}>
            {/* Outer rocky shell with texture */}
            <path
              d={pentagonPath(46)}
              fill="url(#carapace-grad)"
              filter="url(#rocky-texture)"
              stroke="#2a2520"
              strokeWidth={1.5}
            />
            {/* Inner panel — gives depth */}
            <path
              d={pentagonPath(30)}
              fill="none"
              stroke="#3d3830"
              strokeWidth={1}
              opacity={0.6}
            />
            {/* Central mercury core */}
            <circle cx={0} cy={0} r={10} fill="url(#mercury-grad)" opacity={0.85} />
            <circle cx={-2} cy={-3} r={4}  fill="#e8dcc8" opacity={0.45} />

            {/* Listening pulse ring on carapace */}
            {state === 'listening' && (
              <motion.path
                d={pentagonPath(50)}
                fill="none"
                stroke="var(--color-eridian)"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0.95, 1.08, 0.95] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '50%', originY: '50%' }}
              />
            )}
          </motion.g>
        </g>
      </svg>
    </div>
  )
}
