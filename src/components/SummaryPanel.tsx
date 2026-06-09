import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Copy, Layers, UserX, FileText, AlertCircle, ArrowRightLeft, CheckCircle, Clock, ClipboardCheck, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { ANOMALY_ICONS, TRANSFER_STATUS_COLORS, CHECK_TASK_STATUS_COLORS, CHECK_ITEM_STATUS_COLORS, type AnomalyType, type Transfer } from '@/types'
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
  onEditTask?: (taskId: string) => void
}

export function SummaryPanel({ onEditTask }: SummaryPanelProps) {
  const navigate = useNavigate()
  const { anomalies, selectedIds, materials, transfers, toggleSelect, preEventMode, getFilteredMaterials, getPreEventMaterials, checkTasks } = useStore()

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

  const activeTasks = checkTasks.filter((t) => t.status === '进行中')
  const allTaskGapItems = activeTasks.flatMap((t) =>
    t.items.filter((i) => i.status === '缺口').map((i) => ({ ...i, taskName: t.name, taskId: t.id }))
  )
  const allTaskAnomalyItems = activeTasks.flatMap((t) =>
    t.items.filter((i) => i.status === '异常').map((i) => ({ ...i, taskName: t.name, taskId: t.id }))
  )
  const totalTaskGap = allTaskGapItems.reduce((sum, i) => sum + i.gapQuantity, 0)

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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} className="text-amber" />
            <h3 className="font-serif text-base font-semibold text-ink">清点任务</h3>
          </div>
          {activeTasks.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber text-paper text-[10px] font-bold">
              {activeTasks.length}
            </span>
          )}
        </div>

        {activeTasks.length === 0 ? (
          <div className="text-sm text-ink-muted py-6 text-center bg-amber/[0.03] rounded-xl border border-amber/10">
            暂无进行中的清点任务
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {activeTasks.map((task) => {
              const gapCount = task.items.filter((i) => i.status === '缺口').length
              const anomalyCount = task.items.filter((i) => i.status === '异常').length
              const pendingCount = task.items.filter((i) => i.status === '待清点').length
              const sufficientCount = task.items.filter((i) => i.status === '充足').length

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-amber/20 bg-amber/[0.02] transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm text-ink">{task.name}</span>
                    <div className="flex items-center gap-1">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', CHECK_TASK_STATUS_COLORS[task.status])}>
                        {task.status}
                      </span>
                      <button
                        onClick={() => navigate(`/check-task/${task.id}`)}
                        className="p-0.5 text-ink-muted hover:text-ink rounded transition-colors"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-ink-muted mb-1.5">
                    {task.responsible} · {task.items.length} 项
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-ink-muted/10 text-ink-muted">
                        待清点 {pendingCount}
                      </span>
                    )}
                    {gapCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-vermilion/10 text-vermilion">
                        缺口 {gapCount}
                      </span>
                    )}
                    {anomalyCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber/10 text-amber">
                        异常 {anomalyCount}
                      </span>
                    )}
                    {sufficientCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-pine/10 text-pine">
                        充足 {sufficientCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {allTaskGapItems.length > 0 && (
          <div className="p-3 rounded-xl bg-vermilion/[0.04] border border-vermilion/15">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-vermilion" />
              <span className="text-xs font-semibold text-vermilion">任务缺口汇总</span>
            </div>
            <p className="text-xs text-ink-muted">
              共 <span className="font-semibold text-vermilion">{allTaskGapItems.length}</span> 项缺口，总缺口 <span className="font-semibold text-vermilion">{totalTaskGap}</span> 件
            </p>
            <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto">
              {allTaskGapItems.map((item) => {
                const material = materials.find((m) => m.id === item.materialId)
                return (
                  <div key={item.materialId + item.taskId} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      <span className="text-ink">{material?.name || '未知'}</span>
                      <span className="text-ink-muted ml-1">({item.taskName})</span>
                    </span>
                    <span className="text-vermilion font-semibold font-mono">-{item.gapQuantity}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {allTaskAnomalyItems.length > 0 && (
          <div className="p-3 rounded-xl bg-amber/[0.04] border border-amber/15">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-amber" />
              <span className="text-xs font-semibold text-amber">任务异常项汇总</span>
            </div>
            <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
              {allTaskAnomalyItems.map((item) => {
                const material = materials.find((m) => m.id === item.materialId)
                return (
                  <div key={item.materialId + item.taskId} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      <span className="text-ink">{material?.name || '未知'}</span>
                      <span className="text-ink-muted ml-1">({item.taskName})</span>
                    </span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', CHECK_ITEM_STATUS_COLORS[item.status])}>
                      {item.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTasks.length > 0 && (allTaskGapItems.length > 0 || allTaskAnomalyItems.length > 0) && (
          <div className="space-y-1.5">
            {allTaskGapItems.slice(0, 3).map((item) => {
              const material = materials.find((m) => m.id === item.materialId)
              if (!material) return null
              return (
                <button
                  key={`action-${item.materialId}-${item.taskId}`}
                  onClick={() => navigate(`/check-task/${item.taskId}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-paper border border-ink/5 hover:border-ink/15 transition-all text-left"
                >
                  <div className="min-w-0">
                    <span className="text-xs text-ink font-medium">{material.name}</span>
                    <span className="text-[10px] text-ink-muted ml-1">缺口 {item.gapQuantity} 件</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber shrink-0">
                    <ArrowRightLeft size={10} />
                    <span>去处理</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
