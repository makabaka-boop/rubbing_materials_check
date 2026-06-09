import { useState, useMemo } from 'react'
import { X, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MATERIAL_CATEGORIES, MATERIAL_STATUSES, type MaterialCategory, type MaterialStatus } from '@/types'

interface AddModalProps {
  open: boolean
  onClose: () => void
}

export function AddMaterialModal({ open, onClose }: AddModalProps) {
  const addMaterial = useStore((s) => s.addMaterial)
  const materials = useStore((s) => s.materials)
  const getAvailableQuantity = useStore((s) => s.getAvailableQuantity)

  const [form, setForm] = useState({
    name: '',
    category: '拓包' as MaterialCategory,
    cabinet: '',
    quantity: 0,
    threshold: 0,
    responsible: '',
    status: '可使用' as MaterialStatus,
    replenishNote: '',
    remark: '',
  })

  const sameNameMaterials = useMemo(() => {
    return materials.filter((m) => m.name === form.name.trim() && m.cabinet !== form.cabinet.trim())
  }, [materials, form.name, form.cabinet])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addMaterial(form)
    setForm({
      name: '',
      category: '拓包',
      cabinet: '',
      quantity: 0,
      threshold: 0,
      responsible: '',
      status: '可使用',
      replenishNote: '',
      remark: '',
    })
    onClose()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-muted">
          <h2 className="font-serif text-lg font-semibold text-ink">新增材料</h2>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded-lg transition-colors">
            <X size={18} className="text-ink-muted" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">材料名称 *</label>
              {field('name', form.name, '如：大拓包')}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">材料类别</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as MaterialCategory })}
                className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              >
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {sameNameMaterials.length > 0 && (
            <div className="p-3 rounded-lg bg-amber/5 border border-amber/20">
              <p className="text-xs text-amber font-medium mb-1">检测到其他柜位有同名材料，可考虑调拨：</p>
              <div className="space-y-1">
                {sameNameMaterials.map((m) => {
                  const available = getAvailableQuantity(m.id)
                  return (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">
                        柜位 <span className="font-mono text-ink">{m.cabinet}</span>
                      </span>
                      <span className={available > 0 ? 'text-pine' : 'text-ink-muted'}>
                        可调拨 {available} 件
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">收纳柜</label>
              {field('cabinet', form.cabinet, '如：A-01')}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">责任人</label>
              {field('responsible', form.responsible, '姓名')}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">当前数量</label>
              {field('quantity', form.quantity, '0', 'number')}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">最低阈值</label>
              {field('threshold', form.threshold, '0', 'number')}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">状态</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MaterialStatus })}
                className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              >
                {MATERIAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">补料说明</label>
            {field('replenishNote', form.replenishNote, '补料需求说明')}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">备注</label>
            <textarea
              value={form.remark}
              placeholder="其他备注信息"
              rows={2}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-ink-muted/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-muted hover:bg-paper-dark rounded-lg transition-colors">
              取消
            </button>
            <button type="submit" className="inline-flex items-center gap-1.5 px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors">
              <Plus size={14} />
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
