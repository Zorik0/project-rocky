export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[var(--color-space-black)] text-[var(--color-text-primary)] px-6 text-center gap-4">
      <div className="text-4xl font-light tracking-widest text-[var(--color-eridian)]">◈</div>
      <h1 className="text-xl font-semibold tracking-wide">Lost connection to Hail Mary.</h1>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
        Translation matrix offline. Rocky cannot hear you right now.
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mt-2">
        "Stupid network." — Rocky
      </p>
    </div>
  )
}
