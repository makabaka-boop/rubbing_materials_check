import { Plus, Filter, RotateCcw, ClipboardCheck, ListFilter, ArrowRightLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MATERIAL_CATEGORIES, MATERIAL_STATUSES } from '@/types'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  onAddClick: () => void
  onTransferClick: () => void
}

export function Toolbar({ onAddClick, onTransferClick }: ToolbarProps) {
  const { filters, setFilter, resetFilters, preEventMode, togglePreEventMode, onlyPendingTransfers, toggleOnlyPendingTransfers, selectedIds, batchSetStatus, clearSelection, deleteMaterials, materials, getFilteredMaterials, getPreEventMaterials, transfers } = useStore()

  const displayMaterials = preEventMode ? getPreEventMaterials() : getFilteredMaterials()
  const cabinets = [...new Set(materials.map((m) => m.cabinet).filter(Boolean))].sort()
  const responsibles = [...new Set(materials.map((m) => m.responsible).filter(Boolean))].sort()

  const hasFilters = filters.cabinet || filters.category || filters.status || filters.responsible
  const pendingTransferCount = transfers.filter((t) => t.status === '待处理').length

  const selectCls = 'bg-paper-dark/60 border border-paper-muted rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/15 appearance-none cursor-pointer'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">拓包体验材料清点</h1>
          <button
            onClick={togglePreEventMode}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              preEventMode
                ? 'bg-vermilion text-paper border-vermilion shadow-md shadow-vermilion/20'
                : 'bg-paper border-ink/10 text-ink-muted hover:border-ink/30'
            )}
          >
            <ClipboardCheck size={14} />
            {preEventMode ? '退出清点模式' : '活动前清点模式'}
          </button>
          <button
            onClick={toggleOnlyPendingTransfers}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              onlyPendingTransfers
                ? 'bg-amber text-paper border-amber shadow-md shadow-amber/20'
                : 'bg-paper border-ink/10 text-ink-muted hover:border-ink/30'
            )}
          >
            <ArrowRightLeft size={14} />
            仅看待处理调拨
            {pendingTransferCount > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[16px] h-4 rounded-full px-1 text-[10px] font-bold',
                onlyPendingTransfers ? 'bg-paper/20 text-paper' : 'bg-amber/20 text-amber'
              )}>
                {pendingTransferCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTransferClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber text-paper rounded-lg text-sm font-medium hover:bg-amber/90 transition-colors shadow-md shadow-amber/20"
          >
            <ArrowRightLeft size={15} />
            新建调拨
          </button>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors shadow-md shadow-ink/20"
          >
            <Plus size={15} />
            新增材料
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ListFilter size={14} className="text-ink-muted" />
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.cabinet}
            onChange={(e) => setFilter('cabinet', e.target.value)}
            className={selectCls}
          >
            <option value="">全部柜位</option>
            {cabinets.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
            className={selectCls}
          >
            <option value="">全部类别</option>
            {MATERIAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className={selectCls}
          >
            <option value="">全部状态</option>
            {MATERIAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.responsible}
            onChange={(e) => setFilter('responsible', e.target.value)}
            className={selectCls}
          >
            <option value="">全部责任人</option>
            {responsibles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-vermilion hover:bg-vermilion/5 rounded-lg transition-colors"
            >
              <RotateCcw size={12} />
              重置
            </button>
          )}
        </div>
        <span className="text-xs text-ink-muted ml-auto">
          共 {displayMaterials.length} 条
          {preEventMode && <span className="text-vermilion ml-1">（清点模式）</span>}
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-ink/[0.03] rounded-xl border border-ink/5 animate-in">
          <span className="text-xs text-ink-muted">已选 {selectedIds.length} 项</span>
          <div className="flex gap-1.5">
            {MATERIAL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { batchSetStatus(selectedIds, s); clearSelection() }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80',
                  s === '待补料' && 'bg-vermilion/10 text-vermilion border-vermilion/25',
                  s === '待清洁' && 'bg-amber/10 text-amber border-amber/25',
                  s === '可使用' && 'bg-pine/10 text-pine border-pine/25',
                  s === '停用' && 'bg-ink-muted/10 text-ink-muted border-ink-muted/25',
                )}
              >
                标记为{s}
              </button>
            ))}
          </div>
          <button
            onClick={() => { deleteMaterials(selectedIds); clearSelection() }}
            className="px-3 py-1 text-xs text-vermilion hover:bg-vermilion/5 rounded-lg transition-colors ml-2"
          >
            批量删除
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-xs text-ink-muted hover:bg-ink/5 rounded-lg transition-colors"
          >
            取消选择
          </button>
        </div>
      )}
    </div>
  )
}
