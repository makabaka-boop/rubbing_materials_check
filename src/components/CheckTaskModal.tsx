import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MATERIAL_CATEGORIES, type MaterialCategory } from '@/types'
import { cn } from '@/lib/utils'

interface CheckTaskModalProps {
  open: boolean
  onClose: () => void
  editTaskId?: string
}

export function CheckTaskModal({ open, onClose, editTaskId }: CheckTaskModalProps) {
  const { materials, createCheckTask, updateCheckTask, getCheckTask } = useStore()

  const [name, setName] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [responsible, setResponsible] = useState('')
  const [scopeMode, setScopeMode] = useState<'all' | 'category' | 'custom'>('all')
  const [selectedCategories, setSelectedCategories] = useState<MaterialCategory[]>([])
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      if (editTaskId) {
        const task = getCheckTask(editTaskId)
        if (task) {
          setName(task.name)
          setEventTime(task.eventTime)
          setResponsible(task.responsible)
          setSelectedMaterialIds(new Set(task.materialIds))
          if (task.materialIds.length === materials.length && materials.length > 0) {
            setScopeMode('all')
          } else {
            const cats = new Set(task.materialIds.map((mid) => materials.find((m) => m.id === mid)?.category).filter(Boolean))
            if (cats.size > 0 && task.materialIds.length === materials.filter((m) => cats.has(m.category)).length) {
              setScopeMode('category')
              setSelectedCategories(Array.from(cats) as MaterialCategory[])
            } else {
              setScopeMode('custom')
            }
          }
          return
        }
      }
      setName('')
      setEventTime('')
      setResponsible('')
      setScopeMode('all')
      setSelectedCategories([])
      setSelectedMaterialIds(new Set())
    }
  }, [open, editTaskId])

  const filteredMaterials = useMemo(() => {
    if (scopeMode === 'all') return materials
    if (scopeMode === 'category') return materials.filter((m) => selectedCategories.includes(m.category))
    return materials.filter((m) => selectedMaterialIds.has(m.id))
  }, [materials, scopeMode, selectedCategories, selectedMaterialIds])

  const effectiveMaterialIds = useMemo(() => {
    if (scopeMode === 'all') return materials.map((m) => m.id)
    if (scopeMode === 'category') return materials.filter((m) => selectedCategories.includes(m.category)).map((m) => m.id)
    return Array.from(selectedMaterialIds)
  }, [materials, scopeMode, selectedCategories, selectedMaterialIds])

  if (!open) return null

  const toggleCategory = (cat: MaterialCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !eventTime || !responsible.trim() || effectiveMaterialIds.length === 0) return

    if (editTaskId) {
      updateCheckTask(editTaskId, {
        name: name.trim(),
        eventTime,
        responsible: responsible.trim(),
        materialIds: effectiveMaterialIds,
      })
    } else {
      createCheckTask({
        name: name.trim(),
        eventTime,
        responsible: responsible.trim(),
        materialIds: effectiveMaterialIds,
      })
    }
    onClose()
  }

  const fieldCls = 'w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-ink-muted/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-muted">
          <h2 className="font-serif text-lg font-semibold text-ink">
            {editTaskId ? '编辑清点任务' : '创建清点任务'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded-lg transition-colors">
            <X size={18} className="text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">活动名称 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：端午拓包体验活动" className={fieldCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">活动时间 *</label>
              <input type="datetime-local" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={fieldCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">负责人 *</label>
            <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="姓名" className={fieldCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-2">关联材料范围 *</label>
            <div className="flex gap-2 mb-3">
              {(['all', 'category', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setScopeMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    scopeMode === mode
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper border-ink/10 text-ink-muted hover:border-ink/30'
                  )}
                >
                  {mode === 'all' ? '全部材料' : mode === 'category' ? '按类别' : '自定义选择'}
                </button>
              ))}
            </div>

            {scopeMode === 'category' && (
              <div className="flex gap-2 flex-wrap mb-3">
                {MATERIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      selectedCategories.includes(cat)
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper border-ink/10 text-ink-muted hover:border-ink/30'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {scopeMode === 'custom' && (
              <div className="max-h-[200px] overflow-y-auto border border-paper-muted rounded-xl p-2 space-y-1 mb-3">
                {materials.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm',
                      selectedMaterialIds.has(m.id) ? 'bg-ink/5' : 'hover:bg-paper-dark/50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterialIds.has(m.id)}
                      onChange={() => toggleMaterial(m.id)}
                      className="w-3.5 h-3.5 rounded border-ink-muted/40 accent-ink"
                    />
                    <span className="text-ink">{m.name}</span>
                    <span className="text-xs text-ink-muted font-mono ml-auto">{m.cabinet}</span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-ink-muted">
              已选 <span className="font-semibold text-ink">{effectiveMaterialIds.length}</span> 项材料
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors">
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !eventTime || !responsible.trim() || effectiveMaterialIds.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editTaskId ? <Check size={14} /> : <Plus size={14} />}
              {editTaskId ? '保存修改' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
