import { useEffect, useMemo, useState } from 'react'
import { X, ClipboardCheck } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MATERIAL_CATEGORIES, type MaterialCategory, type CheckTask } from '@/types'
import { cn } from '@/lib/utils'

interface CheckTaskModalProps {
  open: boolean
  onClose: () => void
  taskId?: string | null
  onCreated?: (taskId: string) => void
}

type FormState = {
  name: string
  eventTime: string
  owner: string
  scope: 'all' | 'category' | 'custom'
  scopeCategories: MaterialCategory[]
  scopeMaterialIds: string[]
}

const EMPTY_FORM: FormState = {
  name: '',
  eventTime: '',
  owner: '',
  scope: 'all',
  scopeCategories: [],
  scopeMaterialIds: [],
}

export function CheckTaskModal({ open, onClose, taskId, onCreated }: CheckTaskModalProps) {
  const { materials, checkTasks, createCheckTask, updateCheckTask } = useStore()
  const editingTask: CheckTask | undefined = taskId ? checkTasks.find((t) => t.id === taskId) : undefined

  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    if (!open) return
    if (editingTask) {
      setForm({
        name: editingTask.name,
        eventTime: editingTask.eventTime,
        owner: editingTask.owner,
        scope: editingTask.scope,
        scopeCategories: editingTask.scopeCategories,
        scopeMaterialIds: editingTask.scopeMaterialIds,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editingTask])

  const previewMaterials = useMemo(() => {
    if (form.scope === 'all') return materials
    if (form.scope === 'category') {
      const cats = new Set(form.scopeCategories)
      return materials.filter((m) => cats.has(m.category))
    }
    const ids = new Set(form.scopeMaterialIds)
    return materials.filter((m) => ids.has(m.id))
  }, [form, materials])

  if (!open) return null

  const toggleCategory = (c: MaterialCategory) => {
    setForm((f) => ({
      ...f,
      scopeCategories: f.scopeCategories.includes(c)
        ? f.scopeCategories.filter((x) => x !== c)
        : [...f.scopeCategories, c],
    }))
  }

  const toggleMaterial = (id: string) => {
    setForm((f) => ({
      ...f,
      scopeMaterialIds: f.scopeMaterialIds.includes(id)
        ? f.scopeMaterialIds.filter((x) => x !== id)
        : [...f.scopeMaterialIds, id],
    }))
  }

  const canSubmit =
    form.name.trim() &&
    form.eventTime.trim() &&
    form.owner.trim() &&
    (form.scope === 'all' ||
      (form.scope === 'category' && form.scopeCategories.length > 0) ||
      (form.scope === 'custom' && form.scopeMaterialIds.length > 0))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    if (editingTask) {
      updateCheckTask(editingTask.id, {
        name: form.name.trim(),
        eventTime: form.eventTime,
        owner: form.owner.trim(),
        scope: form.scope,
        scopeCategories: form.scopeCategories,
        scopeMaterialIds: form.scopeMaterialIds,
      })
      onClose()
      return
    }
    const task = createCheckTask({
      name: form.name.trim(),
      eventTime: form.eventTime,
      owner: form.owner.trim(),
      scope: form.scope,
      scopeCategories: form.scopeCategories,
      scopeMaterialIds: form.scopeMaterialIds,
    })
    onClose()
    onCreated?.(task.id)
  }

  const inputCls =
    'w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-ink-muted/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-muted">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-vermilion" />
            <h2 className="font-serif text-lg font-semibold text-ink">
              {editingTask ? '编辑清点任务' : '创建活动清点任务'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded-lg transition-colors">
            <X size={18} className="text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">活动名称 *</label>
            <input
              value={form.name}
              placeholder="如：端午拓包体验活动"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">活动时间 *</label>
              <input
                type="datetime-local"
                value={form.eventTime}
                onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">负责人 *</label>
              <input
                value={form.owner}
                placeholder="姓名"
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-2">关联材料范围 *</label>
            <div className="flex gap-2 mb-3">
              {(['all', 'category', 'custom'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, scope: s })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    form.scope === s
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper border-ink/10 text-ink-muted hover:border-ink/30'
                  )}
                >
                  {s === 'all' ? '全部材料' : s === 'category' ? '按类别' : '自定义材料'}
                </button>
              ))}
            </div>

            {form.scope === 'category' && (
              <div className="flex flex-wrap gap-2">
                {MATERIAL_CATEGORIES.map((c) => {
                  const active = form.scopeCategories.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                        active
                          ? 'bg-vermilion/15 text-vermilion border-vermilion/40'
                          : 'bg-paper border-ink/10 text-ink-muted hover:border-ink/30'
                      )}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            )}

            {form.scope === 'custom' && (
              <div className="border border-paper-muted rounded-lg max-h-[220px] overflow-y-auto divide-y divide-paper-muted">
                {materials.map((m) => {
                  const active = form.scopeMaterialIds.includes(m.id)
                  return (
                    <label
                      key={m.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-paper-dark/40 transition-colors',
                        active && 'bg-vermilion/[0.04]'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleMaterial(m.id)}
                        className="w-4 h-4 rounded border-ink-muted/40 accent-ink"
                      />
                      <span className="font-medium text-sm text-ink">{m.name}</span>
                      <span className="text-xs text-ink-muted">{m.category}</span>
                      <span className="ml-auto text-xs font-mono text-ink-muted">{m.cabinet}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-paper-dark/30 border border-paper-muted">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>预计纳入清点</span>
              <span className="font-semibold text-ink">{previewMaterials.length} 项材料</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ClipboardCheck size={14} />
              {editingTask ? '保存修改' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
