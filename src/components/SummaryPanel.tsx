import { AlertTriangle, Copy, Layers, UserX, FileText, AlertCircle, ArrowRightLeft, CheckCircle, Clock, ClipboardCheck, Play, List } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { ANOMALY_ICONS, TRANSFER_STATUS_COLORS, CHECK_TASK_STATUS_COLORS, type AnomalyType, type Transfer, type CheckTask } from '@/types'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  AlertTriangle,
  Copy,
  Layers,
  UserX,
}

const ANOMALY_STYLES: Record<AnomalyType, string> = {
  '低存量': 'border-vermilion/30 bg-vermilion/5',
  '同名重复': 'border-amber/30 bg-amber/5',
  '柜位冲突': 'border-ink-muted/30 bg-ink-muted/5',
  '责任人空缺': 'border-vermilion/30 bg-vermilion/5',
}

const ANOMILY_ICON_COLORS: Record<AnomalyType, string> = {
  '低存量': 'text-vermilion',
  '同名重复': 'text-amber',
  '柜位冲突': 'text-ink-muted',
  '责任人空缺': 'text-vermilion',
}

interface SummaryPanelProps {
  onOpenCheckTask?: () => void
  onContinueTask?: (taskId: string) => void
}

export function SummaryPanel({ onOpenCheckTask, onContinueTask }: SummaryPanelProps) {
  const { anomalies, selectedIds, materials, transfers, toggleSelect, preEventMode, getFilteredMaterials, getPreEventMaterials, checkTasks, getCurrentCheckTask } = useStore()

  const displayMaterials = preEventMode ? getPreEventMaterials() : getFilteredMaterials()
  const displayIdSet = new Set(displayMaterials.map((m) => m.id))
  const selectedMaterials = materials.filter((m) => selectedIds.includes(m.id) && displayIdSet.has(m.id))
  const anomalyIds = useStore.getState().getAnomalyMaterialIds()
  const lowStockMaterials = materials.filter((m) => m.quantity < m.threshold)

  const totalGap = lowStockMaterials.reduce((sum, m) => sum + (m.threshold - m.quantity), 0)

  const pendingTransfers = transfers.filter((t) => t.status === '待处理')
  const completedTransfers = transfers.filter((t) => t.status === '已完成')

  const pendingInQuantity = pendingTransfers.reduce((sum, t) => {
    const toMaterial = materials.find((m) => m.cabinet === t.toCabinet && m.name === t.materialName)
    if (toMaterial && toMaterial.quantity < toMaterial.threshold) {
      return sum + Math.min(t.quantity, toMaterial.threshold - toMaterial.quantity)
    }
    return sum
  }, 0)

  const currentTask = getCurrentCheckTask()
  const activeTasks = checkTasks.filter((t) => t.status === '进行中')
  const recentTasks = [...checkTasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const taskTotalGap = currentTask
    ? currentTask.items.reduce((sum, item) => sum + item.gapQuantity, 0)
    : 0

  const TransferCard = ({ t, clickable = false }: { t: Transfer; clickable?: boolean }) => (
    <div
      className={cn(
        'p-3 rounded-xl border transition-all',
        TRANSFER_STATUS_COLORS[t.status].replace('text-', 'border-').split(' ')[1],
        TRANSFER_STATUS_COLORS[t.status].replace('text-', 'bg-').split(' ')[0],
        clickable && 'cursor-pointer hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-sm text-ink">{t.materialName}</span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full border', TRANSFER_STATUS_COLORS[t.status])}>
          {t.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="font-mono">{t.fromCabinet}</span>
        <span>→</span>
        <span className="font-mono">{t.toCabinet}</span>
        <span className="mx-1">·</span>
        <span className="font-semibold text-ink">{t.quantity}件</span>
      </div>
      <div className="mt-1 text-xs text-ink-muted">
        处理人：{t.handler} · {t.reason}
      </div>
    </div>
  )

  const TaskCard = ({ task }: { task: CheckTask }) => (
    <div
      onClick={() => onContinueTask?.(task.id)}
      className="p-3 rounded-xl border border-paper-muted bg-paper-dark/30 cursor-pointer transition-all hover:shadow-md hover:border-ink/20"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-ink truncate">{task.name}</span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full border shrink-0', CHECK_TASK_STATUS_COLORS[task.status])}>
          {task.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="text-center">
          <div className="font-semibold text-ink">{task.totalCount}</div>
          <div className="text-ink-muted">总项</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-amber">{task.checkedCount}</div>
          <div className="text-ink-muted">已点</div>
        </div>
        <div className="text-center">
          <div className={cn('font-semibold', task.gapCount > 0 ? 'text-vermilion' : 'text-pine')}>
            {task.gapCount}
          </div>
          <div className="text-ink-muted">缺口</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-ink-muted truncate">
        负责人：{task.responsible}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {checkTasks.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-ink/[0.03] to-pine/[0.03] rounded-2xl border border-ink/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className="text-ink" />
              <h3 className="font-serif text-lg font-semibold text-ink">清点任务概览</h3>
            </div>
            <button
              onClick={onOpenCheckTask}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink text-paper rounded-lg text-xs font-medium hover:bg-ink-light transition-colors"
            >
              <List size={12} />
              全部任务
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentTask ? (
              <div className="lg:col-span-2 p-4 bg-paper rounded-xl border border-amber/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{currentTask.name}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', CHECK_TASK_STATUS_COLORS[currentTask.status])}>
                        {currentTask.status}
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      活动时间：{currentTask.eventTime} · 负责人：{currentTask.responsible}
                    </div>
                  </div>
                  <button
                    onClick={() => onContinueTask?.(currentTask.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber text-paper rounded-lg text-xs font-medium hover:bg-amber/90 transition-colors"
                  >
                    <Play size={12} />
                    {currentTask.status === '进行中' ? '继续清点' : '查看详情'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-paper-dark/30 rounded-lg">
                    <div className="text-xl font-bold text-ink">{currentTask.totalCount}</div>
                    <div className="text-xs text-ink-muted">总项数</div>
                  </div>
                  <div className="text-center p-2 bg-paper-dark/30 rounded-lg">
                    <div className="text-xl font-bold text-amber">{currentTask.checkedCount}</div>
                    <div className="text-xs text-ink-muted">已清点</div>
                  </div>
                  <div className="text-center p-2 bg-paper-dark/30 rounded-lg">
                    <div className={cn('text-xl font-bold', currentTask.gapCount > 0 ? 'text-vermilion' : 'text-pine')}>
                      {currentTask.gapCount}
                    </div>
                    <div className="text-xs text-ink-muted">有缺口</div>
                  </div>
                  <div className="text-center p-2 bg-paper-dark/30 rounded-lg">
                    <div className="text-xl font-bold text-pine">{taskTotalGap}</div>
                    <div className="text-xs text-ink-muted">缺口总数</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-muted">清点进度</span>
                    <span className="font-semibold text-ink">
                      {currentTask.totalCount > 0 ? Math.round((currentTask.checkedCount / currentTask.totalCount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-paper-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber to-pine transition-all"
                      style={{
                        width: `${currentTask.totalCount > 0 ? (currentTask.checkedCount / currentTask.totalCount) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 p-4 bg-paper rounded-xl border border-dashed border-paper-muted flex flex-col items-center justify-center">
                <ClipboardCheck size={24} className="text-ink-muted mb-2" />
                <p className="text-sm text-ink-muted mb-2">暂无进行中的清点任务</p>
                <button
                  onClick={onOpenCheckTask}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink text-paper rounded-lg text-xs font-medium hover:bg-ink-light transition-colors"
                >
                  <List size={12} />
                  查看任务列表
                </button>
              </div>
            )}

            {recentTasks.filter(t => t.id !== currentTask?.id).slice(0, 2).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {currentTask && currentTask.gapCount > 0 && (
            <div className="mt-4 p-3 bg-vermilion/[0.04] border border-vermilion/15 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-vermilion" />
                  <span className="text-xs font-semibold text-vermilion">
                    当前任务缺口汇总：{currentTask.gapCount} 项材料存在缺口，共缺 {taskTotalGap} 件
                  </span>
                </div>
                <button
                  onClick={() => onContinueTask?.(currentTask.id)}
                  className="text-xs text-vermilion hover:underline"
                >
                  处理缺口 →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-ink" />
          <h3 className="font-serif text-base font-semibold text-ink">补料备注</h3>
        </div>

        {selectedMaterials.length === 0 ? (
          <div className="text-sm text-ink-muted/60 italic py-6 text-center bg-paper-dark/30 rounded-xl border border-dashed border-paper-muted">
            在上方表格中选中材料以查看补料备注
          </div>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {selectedMaterials.map((m) => (
              <div
                key={m.id}
                onClick={() => toggleSelect(m.id)}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm',
                  m.quantity < m.threshold
                    ? 'border-vermilion/20 bg-vermilion/[0.03]'
                    : 'border-ink/5 bg-paper'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-ink text-sm">{m.name}</span>
                    <span className="ml-2 text-xs text-ink-muted font-mono">{m.cabinet}</span>
                  </div>
                  <span className={cn(
                    'text-xs font-mono font-semibold',
                    m.quantity < m.threshold ? 'text-vermilion' : 'text-pine'
                  )}>
                    {m.quantity}/{m.threshold}
                  </span>
                </div>
                {m.replenishNote && (
                  <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">{m.replenishNote}</p>
                )}
                {m.remark && (
                  <p className="mt-1 text-xs text-ink-muted/60 italic">{m.remark}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {lowStockMaterials.length > 0 && (
          <div className="p-3 rounded-xl bg-vermilion/[0.04] border border-vermilion/15">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-vermilion" />
              <span className="text-xs font-semibold text-vermilion">存量缺口概览</span>
            </div>
            <p className="text-xs text-ink-muted">
              共 <span className="font-semibold text-vermilion">{lowStockMaterials.length}</span> 项低于阈值，总缺口 <span className="font-semibold text-vermilion">{totalGap}</span> 件
            </p>
            {pendingInQuantity > 0 && (
              <p className="text-xs text-pine mt-1">
                待调拨覆盖 <span className="font-semibold">{pendingInQuantity}</span> 件
                {pendingInQuantity >= totalGap ? <span className="text-pine"> ✓ 缺口已全部覆盖</span> : <span className="text-amber"> ⚠ 缺口未完全覆盖</span>}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-ink" />
            <h3 className="font-serif text-base font-semibold text-ink">异常摘要</h3>
          </div>
          {anomalies.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-vermilion text-paper text-[10px] font-bold">
              {anomalies.length}
            </span>
          )}
        </div>

        {anomalies.length === 0 ? (
          <div className="text-sm text-pine py-6 text-center bg-pine/[0.03] rounded-xl border border-pine/10">
            ✓ 暂无异常，所有材料状态正常
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {anomalies.map((a, i) => {
              const IconComp = ICON_MAP[ANOMALY_ICONS[a.type]] || AlertTriangle
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-all',
                    ANOMALY_STYLES[a.type]
                  )}
                >
                  <IconComp size={16} className={cn('mt-0.5 shrink-0', ANOMILY_ICON_COLORS[a.type])} />
                  <div className="min-w-0">
                    <span className={cn('text-xs font-semibold', ANOMILY_ICON_COLORS[a.type])}>
                      {a.type}
                    </span>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{a.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber" />
            <h3 className="font-serif text-base font-semibold text-ink">待处理调拨</h3>
          </div>
          {pendingTransfers.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber text-paper text-[10px] font-bold">
              {pendingTransfers.length}
            </span>
          )}
        </div>

        {pendingTransfers.length === 0 ? (
          <div className="text-sm text-ink-muted py-6 text-center bg-amber/[0.03] rounded-xl border border-amber/10">
            暂无待处理调拨
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {pendingTransfers.map((t) => (
              <TransferCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-pine" />
            <h3 className="font-serif text-base font-semibold text-ink">已完成调拨</h3>
          </div>
          {completedTransfers.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pine text-paper text-[10px] font-bold">
              {completedTransfers.length}
            </span>
          )}
        </div>

        {completedTransfers.length === 0 ? (
          <div className="text-sm text-ink-muted py-6 text-center bg-pine/[0.03] rounded-xl border border-pine/10">
            暂无已完成调拨
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {completedTransfers.slice(-8).reverse().map((t) => (
              <TransferCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
