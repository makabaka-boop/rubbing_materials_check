import { ClipboardCheck, Plus, Calendar, User, ChevronRight, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CHECK_TASK_STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface CheckTaskListProps {
  onCreateClick: () => void
  onOpenTask: (id: string) => void
}

export function CheckTaskList({ onCreateClick, onOpenTask }: CheckTaskListProps) {
  const { checkTasks, deleteCheckTask } = useStore()

  const ongoing = checkTasks.filter((t) => t.status === '进行中')
  const finished = checkTasks.filter((t) => t.status !== '进行中').slice(-6).reverse()

  return (
    <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-vermilion" />
          <h2 className="font-serif text-base font-semibold text-ink">活动清点任务</h2>
          {ongoing.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-vermilion text-paper text-[10px] font-bold px-1.5">
              进行中 {ongoing.length}
            </span>
          )}
        </div>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vermilion text-paper rounded-lg text-xs font-medium hover:bg-vermilion/90 transition-colors shadow-md shadow-vermilion/20"
        >
          <Plus size={13} />
          新建清点任务
        </button>
      </div>

      {checkTasks.length === 0 ? (
        <div className="py-10 text-center bg-paper-dark/30 rounded-xl border border-dashed border-paper-muted">
          <ClipboardCheck size={28} className="mx-auto text-ink-muted/40 mb-2" />
          <p className="text-sm text-ink-muted">暂无清点任务</p>
          <p className="text-xs text-ink-muted/60 mt-1">点击「新建清点任务」开启一次活动前清点</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...ongoing, ...finished].map((task) => {
            const total = task.items.length
            const checked = task.items.filter((i) => i.actualQuantity !== null).length
            const gapCount = task.items.filter((i) => i.gapQuantity > 0).length
            const coveredCount = task.items.filter((i) => i.result === '已覆盖').length
            const isOngoing = task.status === '进行中'
            return (
              <div
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className={cn(
                  'group p-4 rounded-xl border bg-paper hover:shadow-md transition-all cursor-pointer relative',
                  isOngoing ? 'border-vermilion/20 hover:border-vermilion/40' : 'border-ink/8 hover:border-ink/20'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border',
                          CHECK_TASK_STATUS_COLORS[task.status]
                        )}
                      >
                        {task.status}
                      </span>
                      {isOngoing && gapCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-vermilion/10 text-vermilion border border-vermilion/20">
                          缺口 {gapCount}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-ink text-sm truncate">{task.name}</h3>
                  </div>
                  <ChevronRight size={16} className="text-ink-muted/40 group-hover:text-ink-muted transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} />
                    {task.eventTime ? task.eventTime.replace('T', ' ') : '—'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User size={11} />
                    {task.owner}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-muted">
                    进度 <span className="font-mono text-ink font-medium">{checked}/{total}</span>
                  </span>
                  {coveredCount > 0 && (
                    <span className="text-pine">已覆盖 {coveredCount}</span>
                  )}
                </div>
                {!isOngoing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`确定删除任务「${task.name}」？`)) deleteCheckTask(task.id)
                    }}
                    className="absolute top-2 right-7 p-1 text-ink-muted/40 hover:text-vermilion hover:bg-vermilion/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="删除任务"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
