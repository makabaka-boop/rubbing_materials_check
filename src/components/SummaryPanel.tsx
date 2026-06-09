import { AlertTriangle, Copy, Layers, UserX, FileText, AlertCircle, ArrowRightLeft, CheckCircle, Clock, ClipboardCheck, ChevronRight, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { ANOMALY_ICONS, TRANSFER_STATUS_COLORS, CHECK_TASK_STATUS_COLORS, CHECK_ITEM_RESULT_COLORS, type AnomalyType, type Transfer } from '@/types'
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

export function SummaryPanel({
  onCreateCheckTask,
  onOpenCheckTask,
}: {
  onCreateCheckTask?: () => void
  onOpenCheckTask?: (id: string) => void
}) {
  const { anomalies, selectedIds, materials, transfers, checkTasks, toggleSelect, preEventMode, getFilteredMaterials, getPreEventMaterials } = useStore()

  const displayMaterials = preEventMode ? getPreEventMaterials() : getFilteredMaterials()
  const displayIdSet = new Set(displayMaterials.map((m) => m.id))
  const selectedMaterials = materials.filter((m) => selectedIds.includes(m.id) && displayIdSet.has(m.id))
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

  return (
    <div className="space-y-6">
      <CheckTaskOverview
        checkTasks={checkTasks}
        materials={materials}
        onCreateCheckTask={onCreateCheckTask}
        onOpenCheckTask={onOpenCheckTask}
      />

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

interface CheckTaskOverviewProps {
  checkTasks: ReturnType<typeof useStore.getState>['checkTasks']
  materials: ReturnType<typeof useStore.getState>['materials']
  onCreateCheckTask?: () => void
  onOpenCheckTask?: (id: string) => void
}

function CheckTaskOverview({ checkTasks, materials, onCreateCheckTask, onOpenCheckTask }: CheckTaskOverviewProps) {
  const ongoing = checkTasks.filter((t) => t.status === '进行中')
  const totalGapItems = ongoing.reduce(
    (sum, task) => sum + task.items.filter((i) => i.gapQuantity > 0 && i.result !== '已覆盖').length,
    0
  )
  const totalGapQuantity = ongoing.reduce(
    (sum, task) =>
      sum + task.items.filter((i) => i.result !== '已覆盖').reduce((s, i) => s + i.gapQuantity, 0),
    0
  )
  const abnormalItems = ongoing.reduce(
    (sum, task) => sum + task.items.filter((i) => i.result === '异常').length,
    0
  )
  const pendingActions = ongoing.flatMap((task) =>
    task.items
      .filter((i) => i.actionSuggestion === '发起调拨' || i.actionSuggestion === '更新补料' || i.actionSuggestion === '后续跟进')
      .map((i) => ({ task, item: i }))
  )

  return (
    <div className="rounded-2xl border border-vermilion/15 bg-vermilion/[0.02] p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-vermilion" />
          <h3 className="font-serif text-base font-semibold text-ink">清点任务概览</h3>
          {ongoing.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-vermilion text-paper text-[10px] font-bold px-1.5">
              {ongoing.length} 进行中
            </span>
          )}
        </div>
        {onCreateCheckTask && (
          <button
            onClick={onCreateCheckTask}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-vermilion hover:bg-vermilion/10 rounded-lg transition-colors"
          >
            <Plus size={12} />
            新建任务
          </button>
        )}
      </div>

      {ongoing.length === 0 ? (
        <p className="text-xs text-ink-muted">暂无进行中的清点任务，可在活动前发起一次清点以提前识别缺口与异常。</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MiniStat label="进行中任务" value={ongoing.length} tone="vermilion" />
            <MiniStat label="缺口项" value={totalGapItems} tone="vermilion" />
            <MiniStat label="缺口总数" value={totalGapQuantity} tone="vermilion" />
            <MiniStat label="异常项" value={abnormalItems} tone="amber" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-ink-muted">缺口汇总</div>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {ongoing.flatMap((task) =>
                  task.items
                    .filter((i) => i.gapQuantity > 0)
                    .map((i) => {
                      const material = materials.find((m) => m.id === i.materialId)
                      if (!material) return null
                      return (
                        <button
                          key={`${task.id}-${i.materialId}`}
                          onClick={() => onOpenCheckTask?.(task.id)}
                          className="w-full flex items-center justify-between gap-2 p-2 rounded-lg border border-vermilion/15 bg-paper hover:shadow-sm transition-all text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-ink truncate">{material.name}</div>
                            <div className="text-[11px] text-ink-muted truncate">
                              {task.name} · {material.cabinet}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border',
                                CHECK_ITEM_RESULT_COLORS[i.result]
                              )}
                            >
                              {i.result}
                            </span>
                            <span className="text-vermilion font-mono text-xs font-semibold">−{i.gapQuantity}</span>
                            <ChevronRight size={12} className="text-ink-muted/50" />
                          </div>
                        </button>
                      )
                    })
                )}
                {totalGapItems === 0 && (
                  <p className="text-xs text-pine">所有进行中任务暂无缺口</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-ink-muted">待办动作</div>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {pendingActions.length === 0 ? (
                  <p className="text-xs text-ink-muted/70">暂无需要处理的动作</p>
                ) : (
                  pendingActions.map(({ task, item }) => {
                    const material = materials.find((m) => m.id === item.materialId)
                    if (!material) return null
                    const ActionIcon = item.actionSuggestion === '发起调拨' ? ArrowRightLeft : item.actionSuggestion === '更新补料' ? FileText : Clock
                    return (
                      <button
                        key={`${task.id}-${item.materialId}-action`}
                        onClick={() => onOpenCheckTask?.(task.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg border border-amber/20 bg-amber/[0.04] hover:shadow-sm transition-all text-left"
                      >
                        <ActionIcon size={13} className="text-amber shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink truncate">{material.name}</div>
                          <div className="text-[11px] text-ink-muted truncate">{task.name}</div>
                        </div>
                        <span className="text-[10px] text-amber shrink-0">{item.actionSuggestion}</span>
                        <ChevronRight size={12} className="text-ink-muted/50 shrink-0" />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-ink-muted">任务列表</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {ongoing.map((task) => {
                const total = task.items.length
                const checked = task.items.filter((i) => i.actualQuantity !== null).length
                return (
                  <button
                    key={task.id}
                    onClick={() => onOpenCheckTask?.(task.id)}
                    className="text-left p-2.5 rounded-lg border border-ink/8 bg-paper hover:border-vermilion/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-ink truncate">{task.name}</span>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border shrink-0',
                          CHECK_TASK_STATUS_COLORS[task.status]
                        )}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>负责人：{task.owner}</span>
                      <span className="font-mono">{checked}/{total}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'ink' | 'vermilion' | 'pine' | 'amber' }) {
  const toneCls: Record<string, string> = {
    ink: 'text-ink',
    vermilion: 'text-vermilion',
    pine: 'text-pine',
    amber: 'text-amber',
  }
  return (
    <div className="p-2.5 rounded-lg bg-paper border border-ink/8">
      <div className="text-[11px] text-ink-muted">{label}</div>
      <div className={cn('font-serif text-xl font-bold leading-tight mt-0.5', toneCls[tone])}>{value}</div>
    </div>
  )
}
