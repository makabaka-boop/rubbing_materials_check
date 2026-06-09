import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  ClipboardCheck,
  Calendar,
  User,
  Save,
  Pencil,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  CHECK_ITEM_ACTIONS,
  CHECK_ITEM_RESULT_COLORS,
  CHECK_TASK_STATUS_COLORS,
  type CheckItemAction,
} from '@/types'
import { cn } from '@/lib/utils'
import { TransferModal } from '@/components/TransferModal'
import { CheckTaskModal } from '@/components/CheckTaskModal'

export default function CheckTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    checkTasks,
    materials,
    updateCheckItem,
    updateMaterial,
    completeCheckTask,
    cancelCheckTask,
    getPendingTransferQuantity,
    setActiveCheckTask,
  } = useStore()

  const task = checkTasks.find((t) => t.id === id)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferFromId, setTransferFromId] = useState<string | undefined>(undefined)
  const [editOpen, setEditOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [replenishDraftId, setReplenishDraftId] = useState<string | null>(null)
  const [replenishDraft, setReplenishDraft] = useState('')

  const summary = useMemo(() => {
    if (!task) return null
    const total = task.items.length
    const checked = task.items.filter((i) => i.actualQuantity !== null).length
    const gapItems = task.items.filter((i) => i.gapQuantity > 0)
    const totalGap = gapItems.reduce((sum, i) => sum + i.gapQuantity, 0)
    const coveredItems = task.items.filter((i) => i.result === '已覆盖').length
    const abnormalItems = task.items.filter((i) => i.result === '异常').length
    return { total, checked, gapItems, totalGap, coveredItems, abnormalItems }
  }, [task])

  if (!task) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-ink-muted">未找到对应清点任务</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-ink text-paper rounded-lg text-sm hover:bg-ink-light transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const isLocked = task.status !== '进行中'

  const openTransferFor = (materialId: string) => {
    setTransferFromId(materialId)
    setTransferOpen(true)
  }

  const startReplenishEdit = (materialId: string, current: string) => {
    setReplenishDraftId(materialId)
    setReplenishDraft(current)
  }

  const saveReplenish = (materialId: string) => {
    updateMaterial(materialId, { replenishNote: replenishDraft })
    updateCheckItem(task.id, materialId, { actionSuggestion: '更新补料' })
    setReplenishDraftId(null)
    setReplenishDraft('')
  }

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveCheckTask(null)
                navigate('/')
              }}
              className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={16} />
              返回首页
            </button>
            <span className="text-ink-muted/40">/</span>
            <ClipboardCheck size={18} className="text-vermilion" />
            <h1 className="font-serif text-xl font-bold text-ink">{task.name}</h1>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs border',
                CHECK_TASK_STATUS_COLORS[task.status]
              )}
            >
              {task.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isLocked && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-muted hover:text-ink border border-ink/10 hover:border-ink/30 rounded-lg transition-colors"
                >
                  <Pencil size={13} />
                  编辑任务
                </button>
                <button
                  onClick={() => completeCheckTask(task.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine text-paper rounded-lg text-sm font-medium hover:bg-pine/90 transition-colors"
                >
                  <CheckCircle size={14} />
                  完成清点
                </button>
                <button
                  onClick={() => setShowCancelInput((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-vermilion border border-vermilion/30 hover:bg-vermilion/5 rounded-lg transition-colors"
                >
                  <XCircle size={14} />
                  取消任务
                </button>
              </>
            )}
          </div>
        </div>

        {showCancelInput && !isLocked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-vermilion/5 border border-vermilion/20">
            <input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="请填写取消原因"
              className="flex-1 bg-paper border border-paper-muted rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30"
            />
            <button
              disabled={!cancelReason.trim()}
              onClick={() => {
                cancelCheckTask(task.id, cancelReason.trim())
                setShowCancelInput(false)
                setCancelReason('')
              }}
              className="px-3 py-1.5 bg-vermilion text-paper text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认取消
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoCard icon={<Calendar size={14} />} label="活动时间" value={task.eventTime || '—'} />
          <InfoCard icon={<User size={14} />} label="负责人" value={task.owner} />
          <InfoCard
            icon={<ClipboardCheck size={14} />}
            label="材料范围"
            value={
              task.scope === 'all'
                ? `全部（${task.items.length} 项）`
                : task.scope === 'category'
                ? `按类别 · ${task.scopeCategories.join('、')}（${task.items.length} 项）`
                : `自定义 · ${task.items.length} 项`
            }
          />
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="清点进度" value={`${summary.checked}/${summary.total}`} tone="ink" />
            <StatCard label="缺口项" value={summary.gapItems.length} tone="vermilion" />
            <StatCard label="缺口总数" value={summary.totalGap} tone="vermilion" />
            <StatCard label="已覆盖" value={summary.coveredItems} tone="pine" />
            <StatCard label="异常项" value={summary.abnormalItems} tone="amber" />
          </div>
        )}

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink/10 text-left bg-paper-dark/30">
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">材料</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">柜位</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">系统库存</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">阈值</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">实盘数量</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">缺口</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">待入</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">处理建议</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">清点备注</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">补料说明</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">结果</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide w-28">动作</th>
                </tr>
              </thead>
              <tbody>
                {task.items.map((item) => {
                  const material = materials.find((m) => m.id === item.materialId)
                  const pendingIn = Math.max(0, getPendingTransferQuantity(item.materialId))
                  const isReplenishing = replenishDraftId === item.materialId

                  if (!material) {
                    return (
                      <tr key={item.materialId} className="border-b border-ink/5 bg-amber/5">
                        <td colSpan={12} className="px-3 py-3 text-xs text-amber">
                          <AlertTriangle size={13} className="inline mr-1" />
                          材料已被删除（id: {item.materialId}）
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={item.materialId}
                      className={cn(
                        'border-b border-ink/5 transition-colors',
                        item.result === '缺口' && 'bg-vermilion/5',
                        item.result === '异常' && 'bg-amber/5',
                        item.result === '待补料' && 'bg-vermilion/[0.03]',
                        item.result === '已覆盖' && 'bg-pine/[0.03]'
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-ink">{material.name}</div>
                        <div className="text-xs text-ink-muted">{material.category}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-ink/5 rounded text-xs text-ink-muted font-mono">
                          {material.cabinet}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-ink">{material.quantity}</td>
                      <td className="px-3 py-2.5 font-mono text-ink-muted">{material.threshold}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          disabled={isLocked}
                          value={item.actualQuantity ?? ''}
                          placeholder={String(material.quantity)}
                          onChange={(e) => {
                            const v = e.target.value
                            updateCheckItem(task.id, item.materialId, {
                              actualQuantity: v === '' ? null : Number(v),
                            })
                          }}
                          className="w-20 bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30 disabled:bg-paper-dark/40"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        {item.gapQuantity > 0 ? (
                          <span className="font-mono text-vermilion font-semibold">{item.gapQuantity}</span>
                        ) : (
                          <span className="text-pine text-xs">无</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {pendingIn > 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-pine/10 text-pine">
                            +{pendingIn}
                          </span>
                        ) : (
                          <span className="text-ink-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          disabled={isLocked}
                          value={item.actionSuggestion}
                          onChange={(e) =>
                            updateCheckItem(task.id, item.materialId, {
                              actionSuggestion: e.target.value as CheckItemAction,
                            })
                          }
                          className="bg-paper border border-paper-muted rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ink/30 disabled:bg-paper-dark/40"
                        >
                          {CHECK_ITEM_ACTIONS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          disabled={isLocked}
                          value={item.note}
                          placeholder="清点备注"
                          onChange={(e) =>
                            updateCheckItem(task.id, item.materialId, { note: e.target.value })
                          }
                          className="w-36 bg-paper border border-paper-muted rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ink/30 disabled:bg-paper-dark/40"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        {isReplenishing ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={replenishDraft}
                              onChange={(e) => setReplenishDraft(e.target.value)}
                              className="w-32 bg-paper border border-paper-muted rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ink/30"
                            />
                            <button
                              onClick={() => saveReplenish(item.materialId)}
                              className="p-1 text-pine hover:bg-pine/10 rounded"
                            >
                              <Save size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted">{material.replenishNote || '—'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs border',
                            CHECK_ITEM_RESULT_COLORS[item.result]
                          )}
                        >
                          {item.result}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button
                            disabled={isLocked || material.quantity === 0}
                            onClick={() => openTransferFor(item.materialId)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              !isLocked && material.quantity > 0
                                ? 'text-amber hover:bg-amber/10'
                                : 'text-ink-muted/30 cursor-not-allowed'
                            )}
                            title="发起调拨"
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                          <button
                            disabled={isLocked}
                            onClick={() => startReplenishEdit(item.materialId, material.replenishNote)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              !isLocked
                                ? 'text-ink-muted hover:text-ink hover:bg-ink/5'
                                : 'text-ink-muted/30 cursor-not-allowed'
                            )}
                            title="更新补料说明"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {task.items.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-3 py-12 text-center text-sm text-ink-muted">
                      该任务暂无关联材料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        initialFromMaterialId={transferFromId}
      />
      <CheckTaskModal open={editOpen} onClose={() => setEditOpen(false)} taskId={task.id} />
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl bg-paper border border-ink/8">
      <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm text-ink font-medium truncate">{value}</div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'ink' | 'vermilion' | 'pine' | 'amber'
}) {
  const toneCls: Record<string, string> = {
    ink: 'text-ink',
    vermilion: 'text-vermilion',
    pine: 'text-pine',
    amber: 'text-amber',
  }
  return (
    <div className="p-3 rounded-xl bg-paper border border-ink/8">
      <div className="text-xs text-ink-muted mb-1">{label}</div>
      <div className={cn('font-serif text-2xl font-bold', toneCls[tone])}>{value}</div>
    </div>
  )
}
