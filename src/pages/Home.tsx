import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Toolbar } from '@/components/Toolbar'
import { MaterialTable } from '@/components/MaterialTable'
import { SummaryPanel } from '@/components/SummaryPanel'
import { AddMaterialModal } from '@/components/AddMaterialModal'
import { TransferModal } from '@/components/TransferModal'
import { CheckTaskModal } from '@/components/CheckTaskModal'
import { ClipboardCheck, ArrowRightLeft, ClipboardList, ChevronRight, Clock, User, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHECK_TASK_STATUS_COLORS } from '@/types'

export default function Home() {
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showCheckTaskModal, setShowCheckTaskModal] = useState(false)
  const [transferFromMaterialId, setTransferFromMaterialId] = useState<string | undefined>(undefined)
  const { preEventMode, onlyPendingTransfers, getFilteredMaterials, getPreEventMaterials, checkTasks, deleteCheckTask, getCheckTaskStats } = useStore()

  const displayMaterials = preEventMode ? getPreEventMaterials() : getFilteredMaterials()

  const handleRowTransfer = (materialId: string) => {
    setTransferFromMaterialId(materialId)
    setShowTransferModal(true)
  }

  const handleTaskCreated = (taskId: string) => {
    navigate(`/check-task/${taskId}`)
  }

  const sortedTasks = [...checkTasks].sort((a, b) => {
    const statusOrder: Record<string, number> = { '进行中': 0, '待复核': 1, '已完成': 2, '已取消': 3 }
    const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
    if (statusDiff !== 0) return statusDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const activeTasks = sortedTasks.filter((t) => t.status === '进行中' || t.status === '待复核')
  const completedTasks = sortedTasks.filter((t) => t.status === '已完成' || t.status === '已取消')

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <Toolbar
          onAddClick={() => setShowAddModal(true)}
          onTransferClick={() => { setTransferFromMaterialId(undefined); setShowTransferModal(true) }}
          onCheckTaskClick={() => setShowCheckTaskModal(true)}
        />

        {activeTasks.length > 0 && (
          <div className="bg-paper rounded-2xl border border-blue/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5 bg-blue/[0.03]">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-blue" />
                <h3 className="font-serif text-base font-semibold text-ink">进行中的清点任务</h3>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue text-paper text-[10px] font-bold">
                  {activeTasks.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-ink/5">
              {activeTasks.map((task) => {
                const stats = getCheckTaskStats(task.id)
                return (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-paper-dark/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/check-task/${task.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-ink">{task.name}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', CHECK_TASK_STATUS_COLORS[task.status])}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-ink-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {task.eventDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {task.responsible}
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="text-ink-muted">总 {stats.total} 项</span>
                            {stats.pending > 0 && <span className="text-ink-muted">待清点 {stats.pending}</span>}
                            {stats.gap + stats.pendingTransfer > 0 && <span className="text-vermilion">缺口 {stats.gap + stats.pendingTransfer}</span>}
                            {stats.normal > 0 && <span className="text-pine">正常 {stats.normal}</span>}
                          </span>
                        </div>
                        {stats.total > 0 && (
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-paper-dark rounded-full overflow-hidden">
                              <div className="h-full flex">
                                <div className="bg-pine h-full" style={{ width: `${(stats.normal / stats.total) * 100}%` }} />
                                <div className="bg-amber h-full" style={{ width: `${(stats.pendingTransfer / stats.total) * 100}%` }} />
                                <div className="bg-vermilion h-full" style={{ width: `${(stats.gap / stats.total) * 100}%` }} />
                              </div>
                            </div>
                            <span className="text-xs text-ink-muted">
                              {Math.round(((stats.normal + stats.resolved) / stats.total) * 100)}% 完成
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('确定要删除此清点任务吗？')) {
                              deleteCheckTask(task.id)
                            }
                          }}
                          className="p-1.5 text-ink-muted hover:text-vermilion hover:bg-vermilion/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(preEventMode || onlyPendingTransfers) && (
          <div className="flex items-center gap-4 flex-wrap">
            {preEventMode && (
              <div className="flex items-center gap-2 px-4 py-3 bg-vermilion/[0.04] border border-vermilion/15 rounded-xl">
                <ClipboardCheck size={16} className="text-vermilion" />
                <span className="text-sm text-vermilion font-medium">活动前清点模式</span>
                <span className="text-xs text-ink-muted">— 仅显示缺口与异常条目</span>
              </div>
            )}
            {onlyPendingTransfers && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber/[0.04] border border-amber/15 rounded-xl">
                <ArrowRightLeft size={16} className="text-amber" />
                <span className="text-sm text-amber font-medium">待处理调拨筛选</span>
                <span className="text-xs text-ink-muted">— 仅显示有关调拨的材料</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <MaterialTable materials={displayMaterials} preEventMode={preEventMode} onRowTransfer={handleRowTransfer} />
        </div>

        {completedTasks.length > 0 && (
          <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5 bg-ink/[0.02]">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-pine" />
                <h3 className="font-serif text-base font-semibold text-ink">历史清点任务</h3>
                <span className="text-xs text-ink-muted">（{completedTasks.length}）</span>
              </div>
            </div>
            <div className="divide-y divide-ink/5">
              {completedTasks.slice(0, 5).map((task) => {
                const stats = getCheckTaskStats(task.id)
                return (
                  <div
                    key={task.id}
                    className="px-5 py-3 hover:bg-paper-dark/20 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => navigate(`/check-task/${task.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', CHECK_TASK_STATUS_COLORS[task.status])}>
                        {task.status}
                      </span>
                      <span className="text-sm text-ink">{task.name}</span>
                      <span className="text-xs text-ink-muted">{task.eventDate} · {task.responsible}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      {stats.gap + stats.pendingTransfer > 0 ? (
                        <span className="flex items-center gap-1 text-vermilion">
                          <AlertTriangle size={12} />
                          {stats.gap + stats.pendingTransfer} 项缺口
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-pine">
                          <CheckCircle size={12} />
                          全部正常
                        </span>
                      )}
                      <ChevronRight size={14} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm p-5">
          <SummaryPanel />
        </div>
      </div>

      <AddMaterialModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <TransferModal open={showTransferModal} onClose={() => setShowTransferModal(false)} initialFromMaterialId={transferFromMaterialId} />
      <CheckTaskModal open={showCheckTaskModal} onClose={() => setShowCheckTaskModal(false)} onCreated={handleTaskCreated} />
    </div>
  )
}
