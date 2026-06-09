import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MATERIAL_CATEGORIES, type MaterialCategory } from '@/types'

interface CheckTaskModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (taskId: string) => void
}

export function CheckTaskModal({ open, onClose, onCreated }: CheckTaskModalProps) {
  const { materials, createCheckTask } = useStore()
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [responsible, setResponsible] = useState('')
  const [categoryScope, setCategoryScope] = useState<MaterialCategory[]>([])
  const [cabinetScope, setCabinetScope] = useState<string[]>([])

  const cabinets = useMemo(() => {
    const set = new Set<string>()
    materials.forEach((m) => set.add(m.cabinet))
    return Array.from(set).sort()
  }, [materials])

  const responsibles = useMemo(() => {
    const set = new Set<string>()
    materials.forEach((m) => m.responsible && set.add(m.responsible))
    return Array.from(set).sort()
  }, [materials])

  useEffect(() => {
    if (open) {
      setName('')
      setEventDate('')
      setResponsible('')
      setCategoryScope([])
      setCabinetScope([])
    }
  }, [open])

  const toggleCategory = (cat: MaterialCategory) => {
    setCategoryScope((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleCabinet = (cab: string) => {
    setCabinetScope((prev) =>
      prev.includes(cab) ? prev.filter((c) => c !== cab) : [...prev, cab]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !eventDate || !responsible.trim()) return

    const task = createCheckTask({
      name: name.trim(),
      eventDate,
      responsible: responsible.trim(),
      categoryScope,
      cabinetScope,
    })

    onCreated?.(task.id)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-ink/10">
          <h2 className="font-serif text-lg font-semibold text-ink">新建活动清点任务</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">
              活动名称 <span className="text-vermilion">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：春季拓印体验活动"
              className="w-full px-3 py-2 bg-paper border border-paper-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">
                活动时间 <span className="text-vermilion">*</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 bg-paper border border-paper-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">
                负责人 <span className="text-vermilion">*</span>
              </label>
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="输入负责人姓名"
                list="responsible-list"
                className="w-full px-3 py-2 bg-paper border border-paper-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition-all"
                required
              />
              <datalist id="responsible-list">
                {responsibles.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">
              关联材料类别 <span className="text-ink-muted text-xs font-normal">（不选则全部类别）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    categoryScope.includes(cat)
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-ink-muted border-paper-muted hover:border-ink/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">
              关联收纳柜 <span className="text-ink-muted text-xs font-normal">（不选则全部柜位）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {cabinets.map((cab) => (
                <button
                  key={cab}
                  type="button"
                  onClick={() => toggleCabinet(cab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-all ${
                    cabinetScope.includes(cab)
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-ink-muted border-paper-muted hover:border-ink/30'
                  }`}
                >
                  {cab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-ink-muted border border-paper-muted rounded-xl hover:bg-paper-dark/50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm text-paper bg-ink rounded-xl hover:bg-ink-light transition-colors font-medium"
            >
              创建任务
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
