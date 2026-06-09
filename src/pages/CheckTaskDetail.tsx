import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Package, Send, CheckSquare, Square, FileText } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TransferModal } from '@/components/TransferModal'
import { cn } from '@/lib/utils'
import { CHECK_ITEM_STATUS_COLORS, CHECK_SUGGESTIONS, CHECK_TASK_STATUS_COLORS, type CheckItemStatus, type CheckSuggestion } from '@/types'

export default function CheckTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferFromMaterialId, setTransferFromMaterialId] = useState<string | undefined>()
  const [transferForMaterialId, setTransferForMaterialId] = useState<string | undefined>()

  const {
    getCheckTaskById,
    getTaskMaterials,
    getCheckTaskStats,
    updateCheckTaskItem,
    updateCheckTaskStatus,
    getAvailableQuantity,
    materials,
    getMaterialTransfers,
  } = useStore()

  const task = taskId ? getCheckTaskById(taskId) : undefined
  const taskMaterials = taskId ? getTaskMaterials(taskId) : []
  const stats = taskId ? getCheckTaskStats(taskId) : null

  const materialMap = useMemo(() => {
    const map = new Map<string, typeof materials[0]>()
    taskMaterials.forEach((m) => map.set(m.id, m))
    return map
  }, [taskMaterials])

  if (!task) {
    return (
      <div className="min-h-screen bg-paper font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted mb-4">清点任务不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-ink text-paper rounded-xl hover:bg-ink-light transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const handleInitiateTransfer = (materialId: string) => {
    setTransferForMaterialId(materialId)
    setTransferFromMaterialId(materialId)
    setShowTransferModal(true)
  }

  const handleCompleteTask = () => {
    if (stats && stats.pending === 0 && (stats.gap === 0 || window.confirm('仍有缺口项未处理，确定要完成任务吗？'))) {
      updateCheckTaskStatus(task.id, '待复核')
    } else if (stats && stats.pending > 0) {
      alert(`还有 ${stats.pending} 项未清点，请先完成所有材料清点`)
    }
  }

  const handleMarkCompleted = () => {
    updateCheckTaskStatus(task.id, '已完成')
  }

  const isCompleted = task.status === '已完成' || task.status === '已取消'

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-ink-muted hover:text-ink hover:bg-ink/5 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">返回</span>
          </button>
        </div>

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-serif text-2xl font-bold text-ink">{task.name}</h1>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', CHECK_TASK_STATUS_COLORS[task.status])}>
                  {task.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  活动时间：{task.eventDate}
                </span>
                <span>负责人：{task.responsible}</span>
                {task.categoryScope.length > 0 && (
                  <span>类别：{task.categoryScope.join('、')}</span>
                )}
                {task.cabinetScope.length > 0 && (
                  <span>柜位：{task.cabinetScope.join('、')}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {task.status === '进行中' && (
                <button
                  onClick={handleCompleteTask}
                  className="flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-xl hover:bg-ink-light transition-colors text-sm font-medium"
                >
                  <CheckCircle size={16} />
                  提交复核
                </button>
              )}
              {task.status === '待复核' && (
                <button
                  onClick={handleMarkCompleted}
                  className="flex items-center gap-2 px-4 py-2 bg-pine text-paper rounded-xl hover:bg-pine/90 transition-colors text-sm font-medium"
                >
                  <CheckCircle size={16} />
                  确认完成
                </button>
              )}
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-ink/5 border border-ink/10">
                <div className="text-xs text-ink-muted mb-1">总材料</div>
                <div className="text-xl font-bold text-ink font-mono">{stats.total}</div>
              </div>
              <div className="p-3 rounded-xl bg-ink-muted/5 border border-ink-muted/20">
                <div className="text-xs text-ink-muted mb-1">待清点</div>
                <div className="text-xl font-bold text-ink-muted font-mono">{stats.pending}</div>
              </div>
              <div className="p-3 rounded-xl bg-pine/5 border border-pine/20">
                <div className="text-xs text-pine mb-1">正常</div>
                <div className="text-xl font-bold text-pine font-mono">{stats.normal}</div>
              </div>
              <div className="p-3 rounded-xl bg-vermilion/5 border border-vermilion/20">
                <div className="text-xs text-vermilion mb-1">缺口项</div>
                <div className="text-xl font-bold text-vermilion font-mono">{stats.gap}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber/5 border border-amber/20">
                <div className="text-xs text-amber mb-1">待调拨</div>
                <div className="text-xl font-bold text-amber font-mono">{stats.pendingTransfer}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue/5 border border-blue/20">
                <div className="text-xs text-blue mb-1">总缺口</div>
                <div className="text-xl font-bold text-blue font-mono">{stats.totalGap}件</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink/10 text-left">
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">材料名称</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">类别</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">柜位</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">阈值</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">系统库存</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">实盘数量</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">缺口</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">处理建议</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">清点状态</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">备注</th>
                  <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {task.items.map((item) => {
                  const material = materialMap.get(item.materialId)
                  if (!material) return null
                  const itemTransfers = getMaterialTransfers(material.id).filter((t) => t.status === '待处理')

                  return (
                    <tr
                      key={item.materialId}
                      className={cn(
                        'border-b border-ink/5 transition-colors hover:bg-ink/[0.03]',
                        item.status === '缺口' && 'bg-vermilion/5',
                        item.status === '待调拨' && 'bg-amber/5',
                        item.status === '正常' && 'bg-pine/5',
                        item.status === '待清点' && 'bg-paper-dark/20'
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium text-ink">{material.name}</td>
                      <td className="px-3 py-2.5 text-ink-muted">{material.category}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-ink/5 rounded text-xs text-ink-muted font-mono">
                          {material.cabinet}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-ink-muted">{material.threshold}</td>
                      <td className={cn('px-3 py-2.5 font-mono', material.quantity < material.threshold ? 'text-vermilion font-semibold' : 'text-ink')}>
                        {material.quantity}
                      </td>
                      <td className="px-3 py-2.5">
                        {isCompleted ? (
                          <span className="font-mono text-ink">{item.actualQuantity}</span>
                        ) : (
                          <input
                            type="number"
                            value={item.actualQuantity}
                            onChange={(e) => updateCheckTaskItem(task.id, item.materialId, { actualQuantity: Number(e.target.value) })}
                            className="w-16 px-2 py-1 bg-paper border border-paper-muted rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ink/30"
                            min={0}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('font-mono font-semibold', item.gapQuantity > 0 ? 'text-vermilion' : 'text-pine')}>
                          {item.gapQuantity}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {isCompleted ? (
                          <span className="text-ink-muted text-sm">{item.suggestion}</span>
                        ) : (
                          <select
                            value={item.suggestion}
                            onChange={(e) => updateCheckTaskItem(task.id, item.materialId, { suggestion: e.target.value as CheckSuggestion })}
                            className="px-2 py-1 bg-paper border border-paper-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                          >
                            {CHECK_SUGGESTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', CHECK_ITEM_STATUS_COLORS[item.status])}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {isCompleted ? (
                          <span className="text-ink-muted text-xs max-w-[120px] block truncate">{item.note || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => updateCheckTaskItem(task.id, item.materialId, { note: e.target.value })}
                            placeholder="清点备注"
                            className="w-full px-2 py-1 bg-paper border border-paper-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {!isCompleted && item.gapQuantity > 0 && item.status !== '待调拨' && (
                          <button
                            onClick={() => handleInitiateTransfer(material.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-amber hover:bg-amber/10 rounded-lg transition-colors"
                          >
                            <Send size={12} />
                            发起调拨
                          </button>
                        )}
                        {item.status === '待调拨' && itemTransfers.length > 0 && (
                          <span className="text-xs text-amber flex items-center gap-1">
                            <Package size={12} />
                            调拨中
                          </span>
                        )}
                        {item.status === '已解决' && (
                          <span className="text-xs text-pine flex items-center gap-1">
                            <CheckCircle size={12} />
                            已解决
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TransferModal
        open={showTransferModal}
        onClose={() => {
          setShowTransferModal(false)
          setTransferForMaterialId(undefined)
        }}
        initialFromMaterialId={transferFromMaterialId}
        checkTaskId={task.id}
        checkTaskItemId={transferForMaterialId}
      />
    </div>
  )
}
