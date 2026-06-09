import { useState, useRef, useEffect } from 'react'
import { Trash2, Edit3, Check, X, ArrowRightLeft, ClipboardList } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { StatusBadge, StatusSelect } from '@/components/StatusBadge'
import { MATERIAL_CATEGORIES, TRANSFER_STATUS_COLORS, CHECK_ITEM_STATUS_COLORS, type MaterialCategory, type Material, type Transfer } from '@/types'
import { cn } from '@/lib/utils'

interface MaterialTableProps {
  materials: Material[]
  preEventMode: boolean
  onRowTransfer: (materialId: string, toCabinet?: string) => void
}

export function MaterialTable({ materials, preEventMode, onRowTransfer }: MaterialTableProps) {
  const { selectedIds, toggleSelect, toggleSelectAll, updateMaterial, deleteMaterial, getAvailableQuantity, getPendingTransferQuantity, getLatestTransfer, getMaterialCheckStatus } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Material>>({})
  const editRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [editingId])

  const allIds = materials.map((m) => m.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))

  const startEdit = (m: Material) => {
    setEditingId(m.id)
    setEditValues({
      name: m.name,
      category: m.category,
      cabinet: m.cabinet,
      quantity: m.quantity,
      threshold: m.threshold,
      responsible: m.responsible,
      status: m.status,
      replenishNote: m.replenishNote,
      remark: m.remark,
    })
  }

  const saveEdit = () => {
    if (editingId && editValues) {
      updateMaterial(editingId, editValues)
    }
    setEditingId(null)
    setEditValues({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const anomalyIds = useStore.getState().getAnomalyMaterialIds()

  const lowStock = (m: Material) => m.quantity < m.threshold

  if (materials.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-muted text-sm">
        {preEventMode ? '🎉 所有材料满足阈值要求，无缺口异常' : '暂无材料记录，请点击「新增材料」添加'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-ink/10 text-left">
            <th className="px-3 py-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => toggleSelectAll(allIds)}
                className="w-4 h-4 rounded border-ink-muted/40 accent-ink"
              />
            </th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">材料名称</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">类别</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">收纳柜</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">当前数量</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">调拨中</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">最低阈值</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">责任人</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">状态</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">最近调拨</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">清点状态</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">补料说明</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide">备注</th>
            <th className="px-3 py-3 font-medium text-ink-muted text-xs tracking-wide w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => {
            const isEditing = editingId === m.id
            const isSelected = selectedIds.includes(m.id)
            const isLow = lowStock(m)
            const isAnomaly = anomalyIds.has(m.id)
            const pendingTransferQty = getPendingTransferQuantity(m.id)
            const latestTransfer = getLatestTransfer(m.id)
            const availableQty = getAvailableQuantity(m.id)

            return (
              <tr
                key={m.id}
                ref={isEditing ? editRef : undefined}
                className={cn(
                  'border-b border-ink/5 transition-colors',
                  isLow && 'bg-vermilion/5',
                  isSelected && 'bg-ink/5',
                  isAnomaly && !isLow && 'bg-amber/5',
                  isEditing && 'bg-paper-dark/50',
                  'hover:bg-ink/[0.03]'
                )}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(m.id)}
                    className="w-4 h-4 rounded border-ink-muted/40 accent-ink"
                  />
                </td>
                {isEditing ? (
                  <>
                    <td className="px-3 py-2.5">
                      <input
                        value={editValues.name || ''}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="w-full bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={editValues.category || '拓包'}
                        onChange={(e) => setEditValues({ ...editValues, category: e.target.value as MaterialCategory })}
                        className="bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      >
                        {MATERIAL_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={editValues.cabinet || ''}
                        onChange={(e) => setEditValues({ ...editValues, cabinet: e.target.value })}
                        className="w-20 bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        value={editValues.quantity ?? 0}
                        onChange={(e) => setEditValues({ ...editValues, quantity: Number(e.target.value) })}
                        className="w-16 bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-ink-muted text-xs">—</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        value={editValues.threshold ?? 0}
                        onChange={(e) => setEditValues({ ...editValues, threshold: Number(e.target.value) })}
                        className="w-16 bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={editValues.responsible || ''}
                        onChange={(e) => setEditValues({ ...editValues, responsible: e.target.value })}
                        className="w-20 bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusSelect
                        value={editValues.status || '可使用'}
                        onChange={(status) => setEditValues({ ...editValues, status })}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-ink-muted text-xs">—</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-ink-muted text-xs">—</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={editValues.replenishNote || ''}
                        onChange={(e) => setEditValues({ ...editValues, replenishNote: e.target.value })}
                        className="w-full bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        value={editValues.remark || ''}
                        onChange={(e) => setEditValues({ ...editValues, remark: e.target.value })}
                        className="w-full bg-paper border border-paper-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} className="p-1 text-pine hover:bg-pine/10 rounded transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-vermilion hover:bg-vermilion/10 rounded transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2.5 font-medium text-ink">{m.name}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{m.category}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-ink/5 rounded text-xs text-ink-muted font-mono">
                        {m.cabinet}
                      </span>
                    </td>
                    <td className={cn('px-3 py-2.5 font-mono', isLow ? 'text-vermilion font-semibold' : 'text-ink')}>
                      {m.quantity}
                      {isLow && <span className="text-[10px] ml-1">⚠</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {pendingTransferQty !== 0 ? (
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium',
                          pendingTransferQty > 0 ? 'bg-pine/10 text-pine' : 'bg-amber/10 text-amber'
                        )}>
                          {pendingTransferQty > 0 ? '+' : ''}{pendingTransferQty}
                        </span>
                      ) : (
                        <span className="text-ink-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-ink-muted">{m.threshold}</td>
                    <td className="px-3 py-2.5">
                      {m.responsible ? (
                        <span className="text-ink">{m.responsible}</span>
                      ) : (
                        <span className="text-vermilion/60 italic text-xs">未指定</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      {latestTransfer ? (
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border',
                          TRANSFER_STATUS_COLORS[latestTransfer.status]
                        )}>
                          {latestTransfer.status}
                        </span>
                      ) : (
                        <span className="text-ink-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const checkStatus = getMaterialCheckStatus(m.id)
                        if (checkStatus) {
                          return (
                            <span className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border',
                              CHECK_ITEM_STATUS_COLORS[checkStatus.status]
                            )}>
                              <ClipboardList size={10} />
                              {checkStatus.status}
                            </span>
                          )
                        }
                        return <span className="text-ink-muted text-xs">—</span>
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted max-w-[140px] truncate">{m.replenishNote || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted max-w-[100px] truncate">{m.remark || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onRowTransfer(m.id)}
                          disabled={availableQty === 0}
                          className={cn(
                            'p-1 rounded transition-colors',
                            availableQty > 0
                              ? 'text-amber hover:bg-amber/10'
                              : 'text-ink-muted/30 cursor-not-allowed'
                          )}
                          title={availableQty > 0 ? '发起调拨' : '无可调拨库存'}
                        >
                          <ArrowRightLeft size={13} />
                        </button>
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1 text-ink-muted hover:text-ink hover:bg-ink/5 rounded transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteMaterial(m.id)}
                          className="p-1 text-ink-muted hover:text-vermilion hover:bg-vermilion/5 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
