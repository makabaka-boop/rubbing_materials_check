import { useState, useEffect } from 'react'
import { X, Plus, Play, CheckCircle, XCircle, Trash2, ClipboardCheck, Calendar, User, Layers, List } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MATERIAL_CATEGORIES, CHECK_TASK_STATUSES, CHECK_TASK_STATUS_COLORS, type CheckTask, type CheckTaskScope, type MaterialCategory } from '@/types'
import { cn } from '@/lib/utils'

interface CheckTaskModalProps {
  open: boolean
  onClose: () => void
  onStartTask?: (taskId: string) => void
}

export function CheckTaskModal({ open, onClose, onStartTask }: CheckTaskModalProps) {
  const { checkTasks, materials, createCheckTask, deleteCheckTask, startCheckTask } = useStore()
  const [mode, setMode] = useState<'create' | 'list'>('list')

  const [form, setForm] = useState({
    name: '',
    eventTime: '',
    responsible: '',
    scope: '全部材料' as CheckTaskScope,
    scopeCategory: '' as MaterialCategory | '',
    scopeCabinet: '',
    scopeMaterialIds: [] as string[],
    remark: '',
  })

  useEffect(() => {
    if (open) {
      setMode('list')
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setForm({
      name: '',
      eventTime: '',
      responsible: '',
      scope: '全部材料',
      scopeCategory: '',
      scopeCabinet: '',
      scopeMaterialIds: [],
      remark: '',
    })
  }

  if (!open) return null

  const cabinets = [...new Set(materials.map((m) => m.cabinet).filter(Boolean))].sort()

  const getScopeMaterials = () => {
    switch (form.scope) {
      case '全部材料':
        return materials
      case '按类别':
        return form.scopeCategory ? materials.filter((m) => m.category === form.scopeCategory) : []
      case '按柜位':
        return form.scopeCabinet ? materials.filter((m) => m.cabinet === form.scopeCabinet) : []
      case '指定材料':
        return materials.filter((m) => form.scopeMaterialIds.includes(m.id))
      default:
        return []
    }
  }

  const scopeMaterials = getScopeMaterials()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.eventTime || !form.responsible.trim()) return

    const result = createCheckTask({
      name: form.name.trim(),
      eventTime: form.eventTime,
      responsible: form.responsible.trim(),
      scope: form.scope,
      scopeCategory: form.scopeCategory || undefined,
      scopeCabinet: form.scopeCabinet || undefined,
      scopeMaterialIds: form.scopeMaterialIds.length > 0 ? form.scopeMaterialIds : undefined,
      remark: form.remark.trim(),
    })

    if (result) {
      setMode('list')
      resetForm()
    }
  }

  const handleStartTask = (taskId: string) => {
    startCheckTask(taskId)
    onClose()
    onStartTask?.(taskId)
  }

  const toggleMaterialSelect = (materialId: string) => {
    setForm((prev) => ({
      ...prev,
      scopeMaterialIds: prev.scopeMaterialIds.includes(materialId)
        ? prev.scopeMaterialIds.filter((id) => id !== materialId)
        : [...prev.scopeMaterialIds, materialId],
    }))
  }

  const selectAllMaterials = () => {
    setForm((prev) => ({
      ...prev,
      scopeMaterialIds: materials.map((m) => m.id),
    }))
  }

  const clearMaterials = () => {
    setForm((prev) => ({ ...prev, scopeMaterialIds: [] }))
  }

  const field = (key: string, val: string | number, placeholder: string, type = 'text') => (
    <input
      type={type}
      value={val}
      placeholder={placeholder}
      onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
      className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-ink-muted/50"
    />
  )

  const TaskCard = ({ task }: { task: CheckTask }) => (
    <div className="p-4 rounded-xl border border-paper-muted bg-paper-dark/30 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-ink">{task.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
            <Calendar size={12} />
            <span>{task.eventTime}</span>
          </div>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full border', CHECK_TASK_STATUS_COLORS[task.status])}>
          {task.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="text-center p-2 bg-paper rounded-lg">
          <div className="font-semibold text-ink">{task.totalCount}</div>
          <div className="text-ink-muted">总项数</div>
        </div>
        <div className="text-center p-2 bg-paper rounded-lg">
          <div className="font-semibold text-ink">{task.checkedCount}</div>
          <div className="text-ink-muted">已清点</div>
        </div>
        <div className="text-center p-2 bg-paper rounded-lg">
          <div className={cn('font-semibold', task.gapCount > 0 ? 'text-vermilion' : 'text-pine')}>
            {task.gapCount}
          </div>
          <div className="text-ink-muted">有缺口</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-ink-muted">
        <User size={12} />
        <span>负责人：{task.responsible}</span>
        <span className="mx-1">·</span>
        <Layers size={12} />
        <span>{task.scope}</span>
      </div>

      <div className="flex gap-2 mt-4">
        {task.status === '待开始' && (
          <button
            onClick={() => handleStartTask(task.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-ink text-paper rounded-lg text-xs font-medium hover:bg-ink-light transition-colors"
          >
            <Play size={12} />
            开始清点
          </button>
        )}
        {task.status === '进行中' && (
          <button
            onClick={() => handleStartTask(task.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber text-paper rounded-lg text-xs font-medium hover:bg-amber/90 transition-colors"
          >
            <ClipboardCheck size={12} />
            继续清点
          </button>
        )}
        {(task.status === '已完成' || task.status === '已取消') && (
          <button
            onClick={() => handleStartTask(task.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-paper border border-paper-muted text-ink-muted rounded-lg text-xs font-medium hover:bg-paper-dark transition-colors"
          >
            <List size={12} />
            查看详情
          </button>
        )}
        <button
          onClick={() => deleteCheckTask(task.id)}
          className="p-1.5 text-ink-muted hover:text-vermilion hover:bg-vermilion/10 rounded-lg transition-colors"
          title="删除任务"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )

  const sortedTasks = [...checkTasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-muted">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-lg font-semibold text-ink">活动清点任务</h2>
            <div className="flex gap-1 bg-paper-dark/50 rounded-lg p-0.5">
              <button
                onClick={() => setMode('list')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'list' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
                )}
              >
                任务列表
              </button>
              <button
                onClick={() => setMode('create')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'create' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
                )}
              >
                新建任务
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded-lg transition-colors">
            <X size={18} className="text-ink-muted" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {mode === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">活动名称 *</label>
                {field('name', form.name, '如：春季拓印体验活动')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">活动时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.eventTime}
                    onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                    className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">负责人 *</label>
                  {field('responsible', form.responsible, '姓名')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">清点范围</label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value as CheckTaskScope })}
                  className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  <option value="全部材料">全部材料</option>
                  <option value="按类别">按类别</option>
                  <option value="按柜位">按柜位</option>
                  <option value="指定材料">指定材料</option>
                </select>
              </div>

              {form.scope === '按类别' && (
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">选择类别</label>
                  <select
                    value={form.scopeCategory}
                    onChange={(e) => setForm({ ...form, scopeCategory: e.target.value as MaterialCategory })}
                    className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                  >
                    <option value="">请选择类别</option>
                    {MATERIAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope === '按柜位' && (
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">选择柜位</label>
                  <select
                    value={form.scopeCabinet}
                    onChange={(e) => setForm({ ...form, scopeCabinet: e.target.value })}
                    className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                  >
                    <option value="">请选择柜位</option>
                    {cabinets.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope === '指定材料' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-ink-muted">选择材料</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllMaterials}
                        className="text-xs text-ink hover:text-ink-light transition-colors"
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={clearMaterials}
                        className="text-xs text-ink-muted hover:text-ink transition-colors"
                      >
                        清空
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-paper-muted rounded-lg p-2 space-y-1 bg-paper-dark/30">
                    {materials.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-paper cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.scopeMaterialIds.includes(m.id)}
                          onChange={() => toggleMaterialSelect(m.id)}
                          className="w-4 h-4 rounded border-ink-muted/40 accent-ink"
                        />
                        <span className="text-ink">{m.name}</span>
                        <span className="text-xs text-ink-muted font-mono">({m.cabinet})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-paper-dark/30 border border-paper-muted">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <CheckCircle size={12} className="text-pine" />
                  <span>预计清点材料：</span>
                  <span className="font-semibold text-ink">{scopeMaterials.length} 项</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">备注</label>
                <textarea
                  value={form.remark}
                  placeholder="任务备注信息"
                  rows={2}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-ink-muted/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list')
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!form.name.trim() || !form.eventTime || !form.responsible.trim() || scopeMaterials.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  创建任务
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-12 text-ink-muted text-sm">
                  暂无清点任务，点击「新建任务」创建
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {sortedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
