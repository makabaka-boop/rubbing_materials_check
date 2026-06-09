import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Toolbar } from '@/components/Toolbar'
import { MaterialTable } from '@/components/MaterialTable'
import { SummaryPanel } from '@/components/SummaryPanel'
import { AddMaterialModal } from '@/components/AddMaterialModal'
import { TransferModal } from '@/components/TransferModal'
import { CheckTaskModal } from '@/components/CheckTaskModal'
import { ClipboardCheck, ArrowRightLeft, Plus, ChevronRight, Trash2 } from 'lucide-react'
import { CHECK_TASK_STATUS_COLORS, type CheckTask } from '@/types'
import { cn } from '@/lib/utils'

export default function Home() {
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showCheckTaskModal, setShowCheckTaskModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>(undefined)
  const [transferFromMaterialId, setTransferFromMaterialId] = useState<string | undefined>(undefined)
  const { preEventMode, onlyPendingTransfers, getFilteredMaterials, getPreEventMaterials, checkTasks, deleteCheckTask } = useStore()

  const displayMaterials = preEventMode ? getPreEventMaterials() : getFilteredMaterials()

  const activeTasks = checkTasks.filter((t) => t.status === '进行中')
  const completedTasks = checkTasks.filter((t) => t.status !== '进行中')

  const handleRowTransfer = (materialId: string) => {
    setTransferFromMaterialId(materialId)
    setShowTransferModal(true)
  }

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId)
    setShowCheckTaskModal(true)
  }

  const handleCloseTaskModal = () => {
    setShowCheckTaskModal(false)
    setEditingTaskId(undefined)
  }

  const TaskCard = ({ task }: { task: CheckTask }) => {
    const gapCount = task.items.filter((i) => i.status === '缺口').length
    const anomalyCount = task.items.filter((i) => i.status === '异常').length
    const pendingCount = task.items.filter((i) => i.status === '待清点').length
    const sufficientCount = task.items.filter((i) => i.status === '充足').length

    return (
      <div
        className={cn(
          'p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md group',
          task.status === '进行中' ? 'border-amber/20 bg-amber/[0.02]' : 'border-ink/5 bg-paper'
        )}
        onClick={() => task.status === '进行中' ? navigate(`/check-task/${task.id}`) : undefined}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <span className="font-medium text-sm text-ink">{task.name}</span>
            <span className={cn('ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', CHECK_TASK_STATUS_COLORS[task.status])}>
              {task.status}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {task.status === '进行中' && (
              <ChevronRight size={16} className="text-ink-muted group-hover:text-ink transition-colors" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); deleteCheckTask(task.id) }}
              className="p-1 text-ink-muted/40 hover:text-vermilion rounded transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-muted mb-2">
          <span>{task.eventTime ? new Date(task.eventTime).toLocaleDateString('zh-CN') : '未设置时间'}</span>
          <span>·</span>
          <span>{task.responsible}</span>
          <span>·</span>
          <span>{task.items.length} 项材料</span>
        </div>
        <div className="flex gap-2 flex-wrap">
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
  }

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <Toolbar
          onAddClick={() => setShowAddModal(true)}
          onTransferClick={() => { setTransferFromMaterialId(undefined); setShowTransferModal(true) }}
          onCheckTaskClick={() => { setEditingTaskId(undefined); setShowCheckTaskModal(true) }}
        />

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

        {checkTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} className="text-ink" />
                <h2 className="font-serif text-base font-semibold text-ink">清点任务</h2>
                {activeTasks.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber text-paper text-[10px] font-bold">
                    {activeTasks.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setEditingTaskId(undefined); setShowCheckTaskModal(true) }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper border border-ink/10 text-ink-muted rounded-lg text-xs font-medium hover:border-ink/30 transition-all"
              >
                <Plus size={12} />
                新建任务
              </button>
            </div>

            {activeTasks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeTasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink transition-colors py-1">
                  已结束任务（{completedTasks.length}）
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {completedTasks.map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <MaterialTable materials={displayMaterials} preEventMode={preEventMode} onRowTransfer={handleRowTransfer} />
        </div>

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm p-5">
          <SummaryPanel onEditTask={handleEditTask} />
        </div>
      </div>

      <AddMaterialModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <TransferModal open={showTransferModal} onClose={() => setShowTransferModal(false)} initialFromMaterialId={transferFromMaterialId} />
      <CheckTaskModal open={showCheckTaskModal} onClose={handleCloseTaskModal} editTaskId={editingTaskId} />
    </div>
  )
}
