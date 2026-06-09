import { STATUS_COLORS, MATERIAL_STATUSES, type MaterialStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: MaterialStatus
  onClick?: () => void
  selected?: boolean
}

export function StatusBadge({ status, onClick, selected }: StatusBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all',
        STATUS_COLORS[status],
        onClick && 'cursor-pointer hover:opacity-80',
        selected && 'ring-2 ring-ink/30'
      )}
    >
      {status}
    </button>
  )
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: MaterialStatus
  onChange: (status: MaterialStatus) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MaterialStatus)}
      className="bg-transparent text-xs border border-paper-muted rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ink/30"
    >
      {MATERIAL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}
