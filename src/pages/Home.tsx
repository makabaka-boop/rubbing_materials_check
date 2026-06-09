import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Toolbar } from '@/components/Toolbar'
import { MaterialTable } from '@/components/MaterialTable'
import { SummaryPanel } from '@/components/SummaryPanel'
import { AddMaterialModal } from '@/components/AddMaterialModal'
import { TransferModal } from '@/components/TransferModal'
import { CheckTaskModal } from '@/components/CheckTaskModal'
import { CheckTaskList } from '@/components/CheckTaskList'
import { ClipboardCheck, ArrowRightLeft } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showCheckTaskModal, setShowCheckTaskModal] = useState(false)
  const [transferFromMaterialId, setTransferFromMaterialId] = useState<string | undefined>(undefined)
  const { preEventMode, onlyPendingTransfers, getFilteredMaterials, getPreEventMaterials } = useStore()

  const displayMaterials = preEventMode ? getPreEventMaterials() : getFilteredMaterials()

  const handleRowTransfer = (materialId: string) => {
    setTransferFromMaterialId(materialId)
    setShowTransferModal(true)
  }

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <Toolbar
          onAddClick={() => setShowAddModal(true)}
          onTransferClick={() => { setTransferFromMaterialId(undefined); setShowTransferModal(true) }}
          onCheckTaskClick={() => setShowCheckTaskModal(true)}
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

        <CheckTaskList
          onCreateClick={() => setShowCheckTaskModal(true)}
          onOpenTask={(id) => navigate(`/check-tasks/${id}`)}
        />

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <MaterialTable materials={displayMaterials} preEventMode={preEventMode} onRowTransfer={handleRowTransfer} />
        </div>

        <div className="bg-paper rounded-2xl border border-ink/8 shadow-sm p-5">
          <SummaryPanel
            onCreateCheckTask={() => setShowCheckTaskModal(true)}
            onOpenCheckTask={(id) => navigate(`/check-tasks/${id}`)}
          />
        </div>
      </div>

      <AddMaterialModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <TransferModal open={showTransferModal} onClose={() => setShowTransferModal(false)} initialFromMaterialId={transferFromMaterialId} />
      <CheckTaskModal
        open={showCheckTaskModal}
        onClose={() => setShowCheckTaskModal(false)}
        onCreated={(id) => navigate(`/check-tasks/${id}`)}
      />
    </div>
  )
}
