import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, XCircle, ArrowRightLeft, FileEdit, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CHECK_ITEM_STATUS_COLORS, CHECK_TASK_STATUS_COLORS, type CheckItem } from '@/types'
import { cn } from '@/lib/utils'

export default function CheckTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const {
    materials, getCheckTask, updateCheckItem, completeCheckTask,
    cancelCheckTask, refreshCheckTaskItems, createTransfer, getAvailableQuantity,
  } = useStore()

  const [showTransferFor, setShowTransferFor] = useState<string | null>(null)
  const [transferForm, setTransferForm] = useState({
    toCabinet: '',
    quantity: 1,
    handler: '',
    reason: '活动调配' as const,
    remark: '',
  })

  const task = taskId ? getCheckTask(taskId) : undefined

  if (!task) {
    return (
      <div className="min-h-screen bg-paper font-sans flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-ink-muted text-sm">任务不存在或已被删除</p>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded-lg text-sm font-medium">
            <ArrowLeft size={14} />
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const isActive = task.status === '进行中'
  const gapItems = task.items.filter((i) => i.status === '缺口')
  const anomalyItems = task.items.filter((i) => i.status === '异常')
  const pendingItems = task.items.filter((i) => i.status === '待清点')
  const sufficientItems = task.items.filter((i) => i.status === '充足')
  const totalGap = gapItems.reduce((sum, i) => sum + i.gapQuantity, 0)

  const handleActualQuantityChange = (materialId: string, value: string) => {
    const num = value === '' ? null : Number(value)
    if (num !== null && num < 0) return
    updateCheckItem(task.id, materialId, { actualQuantity: num })
  }

  const handleSuggestionChange = (materialId: string, value: string) => {
    updateCheckItem(task.id, materialId, { suggestion: value })
  }

  const handleCheckNoteChange = (materialId: string, value: string) => {
    updateCheckItem(task.id, materialId, { checkNote: value })
  }

  const handleComplete = () => {
    completeCheckTask(task.id)
    navigate('/')
  }

  const handleCancel = () => {
    cancelCheckTask(task.id)
    navigate('/')
  }

  const handleCreateTransfer = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    if (!material) return
    const available = getAvailableQuantity(materialId)
    if (available <= 0 || !transferForm.toCabinet.trim() || transferForm.quantity <= 0 || !transferForm.handler.trim()) return
    if (transferForm.quantity > available) return

    createTransfer({
      fromMaterialId: materialId,
      toCabinet: transferForm.toCabinet,
      quantity: transferForm.quantity,
      handler: transferForm.handler,
      reason: transferForm.reason,
      remark: transferForm.remark || `清点任务「${task.name}」缺口调拨`,
    })
    refreshCheckTaskItems(task.id)
    setShowTransferFor(null)
    setTransferForm({ toCabinet: '', quantity: 1, handler: '', reason: '活动调配', remark: '' })
  }

  const handleUpdateReplenishNote = (materialId: string, item: CheckItem) => {
    const material = materials.find((m) => m.id === materialId)
    if (!material) return
    const note = item.suggestion || item.checkNote
    if (note && note !== material.replenishNote) {
      useStore.getState().updateMaterial(materialId, { replenishNote: note })
    }
  }

  const renderItemRow = (item: CheckItem) => {
    const material = materials.find((m) => m.id === item.materialId)
    if (!material) return null

    return (
      <tr key={item.materialId} className={cn(
        'border-b border-ink/5 transition-colors',
        item.status === '缺口' && 'bg-vermilion/5',
        item.status === '异常' && 'bg-amber/5',
        'hover:bg-ink/[0.03]'
      )}>
        <td className="px-3 py-2.5 font-medium text-ink text-sm">{material.name}</td>
        <td className="px-3 py-2.5 text-ink-muted text-xs">{material.category}</td>
        <td className="px-3 py-2.5">
          <span className="inline-flex items-center px-1.5 py-0.5 bg-ink/5 rounded text-xs text-ink-muted font-mono">
            {material.cabinet}
          </span>
        </td>
        <td className="px-3 py-2.5 font-mono text-sm text-ink">{material.quantity}</td>
        <td className="px-3 py-2.5 font-mono text-sm text-ink-muted">{material.threshold}</td>
        <td className="px-3 py-2.5">
          {isActive ? (
            <input
              type="number"
              min={0}
              value={item.actualQuantity ?? ''}
              placeholder="—"
              onChange={(e) => handleActualQuantityChange(item.materialId, e.target.value)}
              className="w-16 bg-paper border border-paper-muted rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ink/30"
            />
          ) : (
            <span className={cn('font-mono text-sm', item.actualQuantity !== null ? 'text-ink' : 'text-ink-muted')}>
              {item.actualQuantity ?? '—'}
            </span>
          )}
        </td>
        <td className={cn('px-3 py-2.5 font-mono text-sm', item.gapQuantity > 0 ? 'text-vermilion font-semibold' : 'text-ink-muted')}>
          {item.gapQuantity > 0 ? item.gapQuantity : '—'}
        </td>
        <td className="px-3 py-2.5">
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', CHECK_ITEM_STATUS_COLORS[item.status])}>
            {item.status}
          </span>
        </td>
        <td className="px-3 py-2.5">
          {isActive ? (
            <input
              value={item.suggestion}
              placeholder="处理建议"
              onChange={(e) => handleSuggestionChange(item.materialId, e.target.value)}
              className="w-full bg-paper border border-paper-muted rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ink/30"
            />
          ) : (
            <span className="text-xs text-ink-muted">{item.suggestion || '—'}</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          {isActive ? (
            <input
              value={item.checkNote}
              placeholder="清点备注"
              onChange={(e) => handleCheckNoteChange(item.materialId, e.target.value)}
              className="w-full bg-paper border border-paper-muted rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ink/30"
            />
          ) : (
            <span className="text-xs text-ink-muted">{item.checkNote || '—'}</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          {isActive && (
            <div className="flex gap-1">
              {(item.status === '缺口' || item.status === '异常') && (
                <>
                  <button
                    onClick={() => {
                      setShowTransferFor(item.materialId)
                      setTransferForm({ toCabinet: '', quantity: item.gapQuantity || 1, handler: task.responsible, reason: '活动调配', remark: '' })
                    }}
                    disabled={getAvailableQuantity(item.materialId) <= 0}
                    className={cn(
                      'p-1 rounded transition-colors',
                      getAvailableQuantity(item.materialId) > 0
                        ? 'text-amber hover:bg-amber/10'
                        : 'text-ink-muted/30 cursor-not-allowed'
                    )}
                    title="发起调拨"
                  >
                    <ArrowRightLeft size={13} />
                  </button>
                  <button
                    onClick={() => handleUpdateReplenishNote(item.materialId, item)}
                    className="p-1 text-ink-muted hover:text-ink hover:bg-ink/5 rounded transition-colors"
                    title="更新补料说明"
                  >
                    <FileEdit size={13} />
                  </button>
                </>
              )}
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-paper-dark rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-ink-muted" />
            </button>
            <div>
              <h1 className="font-serif text-xl font-bold text-ink">{task.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-ink-muted">
                  活动时间：{task.eventTime ? new Date(task.eventTime).toLocaleString('zh-CN') : '未设置'}
                </span>
                <span className="text-xs text-ink-muted">·</span>
                <span className="text-xs text-ink-muted">负责人：{task.responsible}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border', CHECK_TASK_STATUS_COLORS[task.status])}>
              {task.status}
            </span>
            {isActive && (
              <>
                <button
                  onClick={() => refreshCheckTaskItems(task.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-ink/10 text-ink-muted rounded-lg text-xs font-medium hover:border-ink/30 transition-all"
                >
                  <RefreshCw size={13} />
                  刷新状态
                </button>
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine text-paper rounded-lg text-sm font-medium hover:bg-pine/90 transition-colors shadow-md shadow-pine/20"
                >
                  <Check size={14} />
                  完成清点
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-vermilion/20 text-vermilion rounded-lg text-xs font-medium hover:bg-vermilion/5 transition-all"
                >
                  <XCircle size={13} />
                  取消任务
                </button>
              </>
            )}
          </div>
        </div>

        {(gapItems.length > 0 || anomalyItems.length > 0 || pendingItems.length > 0) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-vermilion/[0.04] border border-vermilion/15">
              <p className="text-xs text-ink-muted">缺口项</p>
              <p className="text-lg font-semibold text-vermilion">{gapItems.length}</p>
              <p className="text-xs text-ink-muted">总缺口 {totalGap} 件</p>
            </div>
            <div className="p-3 rounded-xl bg-amber/[0.04] border border-amber/15">
              <p className="text-xs text-ink-muted">异常项</p>
              <p className="text-lg font-semibold text-amber">{anomalyItems.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-ink-muted/[0.04] border border-ink-muted/15">
              <p className="text-xs text-ink-muted">待清点</p>
              <p className="text-lg font-semibold text-ink-muted">{pendingItems.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-pine/[0.04] border border-pine/15">
              <p className="text-xs text-ink-muted">充足项</p>
              <p className="text-lg font-semibold text-pine">{sufficientItems.length}</p>
            </div>
          </div>
        )}

        {showTransferFor && (
          <div className="p-4 rounded-xl bg-amber/[0.04] border border-amber/15 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                发起调拨 — {materials.find((m) => m.id === showTransferFor)?.name}
              </h3>
              <button onClick={() => setShowTransferFor(null)} className="text-xs text-ink-muted hover:text-ink">关闭</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">调入柜位</label>
                <input
                  value={transferForm.toCabinet}
                  onChange={(e) => setTransferForm({ ...transferForm, toCabinet: e.target.value })}
                  placeholder="如：A-03"
                  className="w-full bg-paper border border-paper-muted rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ink/20"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">数量</label>
                <input
                  type="number"
                  min={1}
                  max={getAvailableQuantity(showTransferFor)}
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  className="w-full bg-paper border border-paper-muted rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ink/20"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">处理人</label>
                <input
                  value={transferForm.handler}
                  onChange={(e) => setTransferForm({ ...transferForm, handler: e.target.value })}
                  placeholder="姓名"
                  className="w-full bg-paper border border-paper-muted rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ink/20"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">备注</label>
                <input
                  value={transferForm.remark}
                  onChange={(e) => setTransferForm({ ...transferForm, remark: e.target.value })}
                  placeholder="可选"
                  className="w-full bg-paper border border-paper-muted rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ink/20"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleCreateTransfer(showTransferFor)}
                  disabled={
                    !transferForm.toCabinet.trim() ||
                    transferForm.quantity <= 0 ||
                    transferForm.quantity > getAvailableQuantity(showTransferFor) ||
                    !transferForm.handler.trim()
                  }
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-amber text-paper rounded-lg text-xs font-medium hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRightLeft size={12} />
                  发起调拨
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              可调拨数量：{getAvailableQuantity(showTransferFor)} 件
            </p>
          </div>
        )}

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink/10 text-left">
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">材料名称</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">类别</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">收纳柜</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">系统库存</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">最低阈值</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">实盘数量</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">缺口数量</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">清点状态</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">处理建议</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">清点备注</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide w-16">操作</th>
                </tr>
              </thead>
              <tbody>
                {task.items.map((item) => renderItemRow(item))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
