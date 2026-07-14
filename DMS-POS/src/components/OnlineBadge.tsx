export function OnlineBadge({
  online,
  pendingCount = 0,
  onPendingClick,
}: {
  online: boolean
  pendingCount?: number
  onPendingClick?: () => void
}) {
  const showDot = pendingCount > 0
  const clickable = Boolean(showDot && onPendingClick)

  const base =
    `relative inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${
      online
        ? 'border-green-400 bg-green-500 text-white'
        : 'border-amber-400 bg-amber-500 text-white'
    }`

  const content = (
    <>
      {online ? 'ONLINE' : 'OFFLINE'}
      {showDot ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-yellow-300 ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (clickable) {
    return (
      <button
        type="button"
        className={`${base} cursor-pointer hover:brightness-110`}
        onClick={() => onPendingClick?.()}
        title={`${pendingCount} item(s) waiting to sync — click for details`}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={base} title={showDot ? `${pendingCount} item(s) waiting to sync` : undefined}>
      {content}
    </span>
  )
}
