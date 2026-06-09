import { useState, useEffect } from 'react'
import { X, ArrowRight, Check, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TRANSFER_REASONS, TRANSFER_STATUS_COLORS, type Transfer, type TransferReason, type Material } from '@/types'
import { cn } from '@/lib/utils'

interface TransferModalProps {
  open: boolean
  onClose: () => void
  initialFromMaterialId?: string
  initialToCabinet?: string
  checkTaskId?: string
  checkTaskItemId?: string
}

export function TransferModal({ open, onClose, initialFromMaterialId, initialToCabinet, checkTaskId, checkTaskItemId }: TransferModalProps) {
  const { materials, createTransfer, completeTransfer, cancelTransfer, getAvailableQuantity, transfers } = useStore()

  const [mode, setMode] = useState<'create' | 'manage'>('create')
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const [form, setForm] = useState({
    fromMaterialId: '',
    toCabinet: '',
    quantity: 1,
    handler: '',
    reason: '库存调拨' as TransferReason,
    remark: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        fromMaterialId: initialFromMaterialId || '',
        toCabinet: initialToCabinet || '',
        quantity: 1,
        handler: '',
        reason: '库存调拨',
        remark: '',
      })
      setMode('create')
      setSelectedTransferId(null)
      setCancelReason('')
    }
  }, [open, initialFromMaterialId, initialToCabinet])

  if (!open) return null

  const fromMaterials = materials.filter((m) => getAvailableQuantity(m.id) > 0)
  const selectedFromMaterial = materials.find((m) => m.id === form.fromMaterialId)
  const availableQty = selectedFromMaterial ? getAvailableQuantity(selectedFromMaterial.id) : 0

  const pendingTransfers = transfers.filter((t) => t.status === '待处理')
  const completedTransfers = transfers.filter((t) => t.status === '已完成').slice(-10).reverse()
  const selectedTransfer = transfers.find((t) => t.id === selectedTransferId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fromMaterialId || !form.toCabinet.trim() || form.quantity <= 0 || !form.handler.trim()) return
    if (form.quantity > availableQty) return

    const result = createTransfer({
      fromMaterialId: form.fromMaterialId,
      toCabinet: form.toCabinet,
      quantity: form.quantity,
      handler: form.handler,
      reason: form.reason,
      remark: form.remark,
      checkTaskId,
      checkTaskItemId,
    })

    if (result) {
      onClose()
    }
  }

  const handleComplete = () => {
    if (selectedTransferId) {
      completeTransfer(selectedTransferId)
      setSelectedTransferId(null)
    }
  }

  const handleCancel = () => {
    if (selectedTransferId && cancelReason.trim()) {
      cancelTransfer(selectedTransferId, cancelReason)
      setSelectedTransferId(null)
      setCancelReason('')
    }
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

  const TransferCard = ({ t }: { t: Transfer }) => (
    <div
      key={t.id}
      onClick={() => t.status === '待处理' && setSelectedTransferId(t.id)}
      className={cn(
        'p-3 rounded-xl border transition-all',
        t.status === '待处理' ? 'cursor-pointer hover:shadow-md' : '',
        selectedTransferId === t.id ? 'border-ink ring-2 ring-ink/20' : 'border-paper-muted',
        t.status === '待处理' ? 'bg-amber/5' : t.status === '已完成' ? 'bg-pine/5' : 'bg-ink-muted/5'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-ink">{t.materialName}</span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full border', TRANSFER_STATUS_COLORS[t.status])}>
          {t.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="font-mono">{t.fromCabinet}</span>
        <ArrowRight size={12} />
        <span className="font-mono">{t.toCabinet}</span>
        <span className="mx-1">·</span>
        <span className="font-semibold text-ink">{t.quantity}件</span>
      </div>
      <div className="mt-1.5 text-xs text-ink-muted">
        <span>处理人：{t.handler}</span>
        <span className="mx-1">·</span>
        <span>{t.reason}</span>
      </div>
      {t.cancelReason && (
        <div className="mt-1.5 text-xs text-vermilion">
          取消原因：{t.cancelReason}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-muted">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-lg font-semibold text-ink">材料调拨</h2>
            <div className="flex gap-1 bg-paper-dark/50 rounded-lg p-0.5">
              <button
                onClick={() => setMode('create')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'create' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
                )}
              >
                新建调拨
              </button>
              <button
                onClick={() => setMode('manage')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'manage' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
                )}
              >
                调拨记录
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
                <label className="block text-xs font-medium text-ink-muted mb-1">调出材料 *</label>
                <select
                  value={form.fromMaterialId}
                  onChange={(e) => setForm({ ...form, fromMaterialId: e.target.value })}
                  className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  <option value="">选择调出材料</option>
                  {fromMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}（{m.cabinet}）- 可调拨 {getAvailableQuantity(m.id)} 件
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">调入柜位 *</label>
                {field('toCabinet', form.toCabinet, '如：A-03')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">调拨数量 *</label>
                  <input
                    type="number"
                    min={1}
                    max={availableQty}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                  />
                  {selectedFromMaterial && (
                    <p className="mt-1 text-xs text-ink-muted">可调拨数量：{availableQty} 件</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">处理人 *</label>
                  {field('handler', form.handler, '姓名')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">调拨原因</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value as TransferReason })}
                  className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  {TRANSFER_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">备注</label>
                <textarea
                  value={form.remark}
                  placeholder="调拨备注信息"
                  rows={2}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="w-full bg-paper-dark/50 border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-ink-muted/50 resize-none"
                />
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
                  disabled={!form.fromMaterialId || !form.toCabinet.trim() || form.quantity <= 0 || form.quantity > availableQty || !form.handler.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建调拨
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {pendingTransfers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-2">待处理调拨（{pendingTransfers.length}）</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {pendingTransfers.map((t) => (
                      <TransferCard key={t.id} t={t} />
                    ))}
                  </div>
                </div>
              )}

              {selectedTransfer && (
                <div className="p-4 rounded-xl bg-paper-dark/30 border border-paper-muted">
                  <h4 className="text-sm font-semibold text-ink mb-3">处理调拨</h4>
                  <div className="mb-3">
                    <p className="text-xs text-ink-muted mb-1">取消原因</p>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="如取消请填写原因"
                      className="w-full bg-paper border border-paper-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleComplete}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-pine text-paper rounded-lg text-sm font-medium hover:bg-pine/90 transition-colors"
                    >
                      <Check size={14} />
                      确认完成
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={!cancelReason.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-vermilion text-paper rounded-lg text-sm font-medium hover:bg-vermilion/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={14} />
                      取消调拨
                    </button>
                  </div>
                </div>
              )}

              {completedTransfers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-2">最近完成（{completedTransfers.length}）</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {completedTransfers.map((t) => (
                      <TransferCard key={t.id} t={t} />
                    ))}
                  </div>
                </div>
              )}

              {pendingTransfers.length === 0 && completedTransfers.length === 0 && (
                <div className="text-center py-12 text-ink-muted text-sm">
                  暂无调拨记录
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
