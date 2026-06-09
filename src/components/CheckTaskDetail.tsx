import { useState } from 'react'
import { X, ArrowLeft, CheckCircle, ArrowRightLeft, Edit3, Save, AlertTriangle, Clock, CheckSquare } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CHECK_ITEM_STATUS_COLORS, CHECK_TASK_STATUS_COLORS, type CheckTaskItem } from '@/types'
import { cn } from '@/lib/utils'

interface CheckTaskDetailProps {
  open: boolean
  onClose: () => void
  onTransferClick: (materialId: string, toCabinet?: string) => void
  onUpdateMaterialNote: (materialId: string, note: string) => void
}

export function CheckTaskDetail({ open, onClose, onTransferClick, onUpdateMaterialNote }: CheckTaskDetailProps) {
  const { getCurrentCheckTask, updateCheckTaskItem, completeCheckTask, cancelCheckTask, getPendingTransferQuantity, materials } = useStore()
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<CheckTaskItem>>({})
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'uncheck' | 'gap' | 'checked'>('all')

  const task = getCurrentCheckTask()

  if (!open || !task) return null

  const filteredItems = task.items.filter((item) => {
    switch (filterStatus) {
      case 'uncheck':
        return item.status === '未清点'
      case 'gap':
        return item.status === '有缺口'
      case 'checked':
        return item.status === '已清点' || item.status === '已解决'
      default:
        return true
    }
  })

  const startEdit = (item: CheckTaskItem) => {
    setEditingItemId(item.materialId)
    setEditValues({
      actualQuantity: item.actualQuantity ?? item.systemQuantity,
      handleSuggestion: item.handleSuggestion,
      checkRemark: item.checkRemark,
    })
  }

  const saveEdit = () => {
    if (editingItemId && editValues) {
      updateCheckTaskItem(task.id, editingItemId, editValues)
    }
    setEditingItemId(null)
    setEditValues({})
  }

  const cancelEdit = () => {
    setEditingItemId(null)
    setEditValues({})
  }

  const handleComplete = () => {
    completeCheckTask(task.id)
    onClose()
  }

  const handleCancelTask = () => {
    if (cancelReason.trim()) {
      cancelCheckTask(task.id, cancelReason)
      setShowCancelConfirm(false)
      setCancelReason('')
      onClose()
    }
  }

  const progress = task.totalCount > 0 ? Math.round((task.checkedCount / task.totalCount) * 100) : 0
  const canComplete = task.checkedCount === task.totalCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-muted">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-paper-dark rounded-lg transition-colors text-ink-muted"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-lg font-semibold text-ink">{task.name}</h2>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', CHECK_TASK_STATUS_COLORS[task.status])}>
                  {task.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-ink-muted">
                <span>活动时间：{task.eventTime}</span>
                <span>负责人：{task.responsible}</span>
                <span>范围：{task.scope}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded-lg transition-colors">
            <X size={18} className="text-ink-muted" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-paper-muted bg-paper-dark/30">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-paper rounded-xl">
              <div className="text-2xl font-bold text-ink">{task.totalCount}</div>
              <div className="text-xs text-ink-muted mt-1">总项数</div>
            </div>
            <div className="text-center p-3 bg-paper rounded-xl">
              <div className="text-2xl font-bold text-amber">{task.checkedCount}</div>
              <div className="text-xs text-ink-muted mt-1">已清点</div>
            </div>
            <div className="text-center p-3 bg-paper rounded-xl">
              <div className={cn('text-2xl font-bold', task.gapCount > 0 ? 'text-vermilion' : 'text-pine')}>
                {task.gapCount}
              </div>
              <div className="text-xs text-ink-muted mt-1">有缺口</div>
            </div>
            <div className="text-center p-3 bg-paper rounded-xl">
              <div className="text-2xl font-bold text-pine">{task.resolvedCount}</div>
              <div className="text-xs text-ink-muted mt-1">已解决</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">清点进度</span>
              <span className="font-semibold text-ink">{progress}%</span>
            </div>
            <div className="h-2 bg-paper-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber to-pine transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-paper-muted flex items-center justify-between">
          <div className="flex gap-1 bg-paper-dark/50 rounded-lg p-0.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                filterStatus === 'all' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
              )}
            >
              全部
            </button>
            <button
              onClick={() => setFilterStatus('uncheck')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                filterStatus === 'uncheck' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
              )}
            >
              未清点
            </button>
            <button
              onClick={() => setFilterStatus('gap')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                filterStatus === 'gap' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
              )}
            >
              有缺口
            </button>
            <button
              onClick={() => setFilterStatus('checked')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                filterStatus === 'checked' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
              )}
            >
              已清点
            </button>
          </div>
          <span className="text-xs text-ink-muted">共 {filteredItems.length} 项</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-ink-muted text-sm">
              暂无数据
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const isEditing = editingItemId === item.materialId
                const pendingQty = getPendingTransferQuantity(item.materialId)
                const material = materials.find((m) => m.id === item.materialId)

                return (
                  <div
                    key={item.materialId}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      item.status === '有缺口' ? 'border-vermilion/20 bg-vermilion/[0.03]' : 'border-paper-muted bg-paper-dark/20',
                      isEditing && 'ring-2 ring-ink/20 border-ink'
                    )}
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-ink">{item.materialName}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                              <span className="font-mono">{item.cabinet}</span>
                              <span>{item.category}</span>
                            </div>
                          </div>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border', CHECK_ITEM_STATUS_COLORS[item.status])}>
                            {item.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-ink-muted mb-1">系统数量</label>
                            <div className="px-3 py-2 bg-paper rounded-lg text-sm font-mono">{item.systemQuantity}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-ink-muted mb-1">实盘数量 *</label>
                            <input
                              type="number"
                              min={0}
                              value={editValues.actualQuantity ?? 0}
                              onChange={(e) => setEditValues({ ...editValues, actualQuantity: Number(e.target.value) })}
                              className="w-full bg-paper border border-paper-muted rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ink/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-ink-muted mb-1">最低阈值</label>
                            <div className="px-3 py-2 bg-paper rounded-lg text-sm font-mono">{item.threshold}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-ink-muted mb-1">调拨中</label>
                            <div className={cn(
                              'px-3 py-2 rounded-lg text-sm font-mono',
                              pendingQty !== 0 ? 'bg-amber/10 text-amber' : 'bg-paper text-ink-muted'
                            )}>
                              {pendingQty > 0 ? `+${pendingQty}` : pendingQty < 0 ? pendingQty : '0'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-ink-muted mb-1">处理建议</label>
                          <textarea
                            value={editValues.handleSuggestion || ''}
                            onChange={(e) => setEditValues({ ...editValues, handleSuggestion: e.target.value })}
                            placeholder="如：从A-01柜调拨、需要采购补料等"
                            rows={2}
                            className="w-full bg-paper border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-ink-muted mb-1">清点备注</label>
                          <textarea
                            value={editValues.checkRemark || ''}
                            onChange={(e) => setEditValues({ ...editValues, checkRemark: e.target.value })}
                            placeholder="清点过程中的备注信息"
                            rows={2}
                            className="w-full bg-paper border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-1.5 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={saveEdit}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors"
                          >
                            <Save size={14} />
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 mt-0.5 text-ink-muted hover:text-ink hover:bg-ink/5 rounded transition-colors"
                              title="编辑清点"
                            >
                              <Edit3 size={14} />
                            </button>
                            <div>
                              <h4 className="font-medium text-ink">{item.materialName}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-ink/5 rounded font-mono">
                                  {item.cabinet}
                                </span>
                                <span>{item.category}</span>
                              </div>
                            </div>
                          </div>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border', CHECK_ITEM_STATUS_COLORS[item.status])}>
                            {item.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-3 mt-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold font-mono text-ink">
                              {item.actualQuantity ?? item.systemQuantity}
                            </div>
                            <div className="text-xs text-ink-muted mt-1">
                              {item.actualQuantity !== null ? '实盘数量' : '系统数量'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={cn(
                              'text-lg font-semibold font-mono',
                              pendingQty !== 0 ? 'text-amber' : 'text-ink-muted'
                            )}>
                              {pendingQty > 0 ? `+${pendingQty}` : pendingQty < 0 ? pendingQty : '0'}
                            </div>
                            <div className="text-xs text-ink-muted mt-1">调拨中</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold font-mono text-ink-muted">{item.threshold}</div>
                            <div className="text-xs text-ink-muted mt-1">最低阈值</div>
                          </div>
                          <div className="text-center">
                            <div className={cn(
                              'text-lg font-semibold font-mono',
                              item.gapQuantity > 0 ? 'text-vermilion' : 'text-pine'
                            )}>
                              {item.gapQuantity > 0 ? `-${item.gapQuantity}` : '0'}
                            </div>
                            <div className="text-xs text-ink-muted mt-1">缺口数量</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {item.status === '有缺口' && (
                              <button
                                onClick={() => onTransferClick(item.materialId, item.cabinet)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-amber/10 text-amber border border-amber/20 rounded-lg text-xs font-medium hover:bg-amber/20 transition-colors"
                              >
                                <ArrowRightLeft size={12} />
                                发起调拨
                              </button>
                            )}
                            {item.status === '有缺口' && material && (
                              <button
                                onClick={() => onUpdateMaterialNote(item.materialId, item.handleSuggestion)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-vermilion/10 text-vermilion border border-vermilion/20 rounded-lg text-xs font-medium hover:bg-vermilion/20 transition-colors"
                              >
                                <Edit3 size={12} />
                                更新补料说明
                              </button>
                            )}
                          </div>
                        </div>

                        {(item.handleSuggestion || item.checkRemark) && (
                          <div className="mt-4 pt-4 border-t border-paper-muted space-y-2">
                            {item.handleSuggestion && (
                              <div>
                                <span className="text-xs font-medium text-ink-muted">处理建议：</span>
                                <span className="text-xs text-ink ml-1">{item.handleSuggestion}</span>
                              </div>
                            )}
                            {item.checkRemark && (
                              <div>
                                <span className="text-xs font-medium text-ink-muted">清点备注：</span>
                                <span className="text-xs text-ink-muted ml-1">{item.checkRemark}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-paper-muted bg-paper-dark/20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <div className="flex items-center gap-1">
              <CheckSquare size={14} className="text-pine" />
              <span>已清点 {task.checkedCount}/{task.totalCount}</span>
            </div>
            {task.gapCount > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle size={14} className="text-vermilion" />
                <span>{task.gapCount} 项存在缺口</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {task.status === '进行中' && (
              <>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors"
                >
                  取消任务
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!canComplete}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-pine text-paper rounded-lg text-sm font-medium hover:bg-pine/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={14} />
                  完成清点
                </button>
              </>
            )}
            {task.status !== '进行中' && (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
            <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <h3 className="font-serif text-lg font-semibold text-ink mb-4">取消清点任务</h3>
              <p className="text-sm text-ink-muted mb-4">确定要取消此清点任务吗？请填写取消原因：</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="请填写取消原因"
                rows={3}
                className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 resize-none mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={handleCancelTask}
                  disabled={!cancelReason.trim()}
                  className="px-4 py-2 bg-vermilion text-paper rounded-lg text-sm font-medium hover:bg-vermilion/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
