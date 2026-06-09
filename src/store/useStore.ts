import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Material, FilterState, Anomaly, AnomalyType, MaterialStatus, Transfer, TransferStatus, TransferReason, CheckTask, CheckItem, CheckTaskStatus, CheckItemStatus } from '@/types'

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36)

const now = () => new Date().toISOString()

const INITIAL_MATERIALS: Material[] = [
  { id: generateId(), name: '大拓包', category: '拓包', cabinet: 'A-01', quantity: 8, threshold: 5, responsible: '王芳', status: '可使用', replenishNote: '', remark: '上次活动损耗较大', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '小拓包', category: '拓包', cabinet: 'A-01', quantity: 8, threshold: 5, responsible: '王芳', status: '可使用', replenishNote: '', remark: '', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '生宣纸', category: '宣纸', cabinet: 'B-02', quantity: 2, threshold: 10, responsible: '李明', status: '待补料', replenishNote: '库存不足，急需补货', remark: '近期活动用量大', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '熟宣纸', category: '宣纸', cabinet: 'B-03', quantity: 15, threshold: 8, responsible: '李明', status: '可使用', replenishNote: '', remark: '', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '墨垫（大）', category: '墨垫', cabinet: 'C-01', quantity: 4, threshold: 4, responsible: '', status: '待清洁', replenishNote: '', remark: '上次使用后未清洁', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '墨垫（小）', category: '墨垫', cabinet: 'C-02', quantity: 6, threshold: 4, responsible: '赵强', status: '可使用', replenishNote: '', remark: '', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '棉布围裙', category: '围裙', cabinet: 'D-01', quantity: 0, threshold: 5, responsible: '', status: '停用', replenishNote: '全部报废需重新采购', remark: '严重磨损', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '防水围裙', category: '围裙', cabinet: 'D-01', quantity: 7, threshold: 5, responsible: '陈雪', status: '可使用', replenishNote: '', remark: '', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '大拓包', category: '拓包', cabinet: 'A-02', quantity: 1, threshold: 3, responsible: '孙丽', status: '待补料', replenishNote: '需从A-01柜调拨', remark: '与其他柜位大拓包同名', createdAt: now(), updatedAt: now() },
  { id: generateId(), name: '墨汁瓶', category: '其他', cabinet: 'C-01', quantity: 5, threshold: 3, responsible: '赵强', status: '可使用', replenishNote: '', remark: '与墨垫同柜', createdAt: now(), updatedAt: now() },
]

const INITIAL_TRANSFERS: Transfer[] = []
const INITIAL_CHECK_TASKS: CheckTask[] = []

function computeCheckItemStatus(
  material: Material | undefined,
  actualQuantity: number | null,
  anomalyIds: Set<string>,
  materialId: string
): CheckItemStatus {
  if (actualQuantity === null) return '待清点'
  if (!material) return '待清点'
  if (anomalyIds.has(materialId)) return '异常'
  if (actualQuantity < material.threshold) return '缺口'
  return '充足'
}

function buildCheckItems(materialIds: string[], materials: Material[], anomalyIds: Set<string>): CheckItem[] {
  return materialIds.map((mid) => {
    const material = materials.find((m) => m.id === mid)
    return {
      materialId: mid,
      actualQuantity: null,
      gapQuantity: material ? Math.max(0, material.threshold - material.quantity) : 0,
      suggestion: '',
      checkNote: '',
      status: computeCheckItemStatus(material, null, anomalyIds, mid),
    }
  })
}

function detectAnomalies(materials: Material[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  materials.forEach((m) => {
    if (m.quantity < m.threshold) {
      anomalies.push({
        type: '低存量',
        materialIds: [m.id],
        message: `「${m.name}」当前 ${m.quantity} 件，低于阈值 ${m.threshold} 件，缺口 ${m.threshold - m.quantity} 件`,
      })
    }
  })

  const nameMap = new Map<string, Material[]>()
  materials.forEach((m) => {
    const list = nameMap.get(m.name) || []
    list.push(m)
    nameMap.set(m.name, list)
  })
  nameMap.forEach((list, name) => {
    if (list.length > 1) {
      anomalies.push({
        type: '同名重复',
        materialIds: list.map((m) => m.id),
        message: `「${name}」存在 ${list.length} 条同名记录，分别位于 ${list.map((m) => m.cabinet).join('、')}`,
      })
    }
  })

  const cabinetMap = new Map<string, Material[]>()
  materials.forEach((m) => {
    const list = cabinetMap.get(m.cabinet) || []
    list.push(m)
    cabinetMap.set(m.cabinet, list)
  })
  const categoryByCabinet = new Map<string, Set<string>>()
  materials.forEach((m) => {
    if (!categoryByCabinet.has(m.cabinet)) categoryByCabinet.set(m.cabinet, new Set())
    categoryByCabinet.get(m.cabinet)!.add(m.category)
  })
  categoryByCabinet.forEach((cats, cabinet) => {
    if (cats.size > 1) {
      const items = cabinetMap.get(cabinet) || []
      anomalies.push({
        type: '柜位冲突',
        materialIds: items.map((m) => m.id),
        message: `柜位「${cabinet}」混存 ${cats.size} 种类别（${Array.from(cats).join('、')}），建议分类收纳`,
      })
    }
  })

  materials.forEach((m) => {
    if (!m.responsible.trim()) {
      anomalies.push({
        type: '责任人空缺',
        materialIds: [m.id],
        message: `「${m.name}」（${m.cabinet}）未指定责任人`,
      })
    }
  })

  return anomalies
}

interface AppStore {
  materials: Material[]
  selectedIds: string[]
  filters: FilterState
  preEventMode: boolean
  onlyPendingTransfers: boolean
  anomalies: Anomaly[]
  transfers: Transfer[]
  checkTasks: CheckTask[]

  setMaterials: (materials: Material[]) => void
  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMaterial: (id: string, updates: Partial<Material>) => void
  deleteMaterial: (id: string) => void
  deleteMaterials: (ids: string[]) => void
  toggleSelect: (id: string) => void
  toggleSelectAll: (ids: string[]) => void
  clearSelection: () => void
  batchSetStatus: (ids: string[], status: MaterialStatus) => void
  setFilter: (key: keyof FilterState, value: string) => void
  resetFilters: () => void
  togglePreEventMode: () => void
  toggleOnlyPendingTransfers: () => void
  getFilteredMaterials: () => Material[]
  getPreEventMaterials: () => Material[]
  getAnomalyMaterialIds: () => Set<string>
  recalcAnomalies: () => void
  getAvailableQuantity: (materialId: string) => number
  getPendingTransferQuantity: (materialId: string) => number
  getMaterialTransfers: (materialId: string) => Transfer[]
  getLatestTransfer: (materialId: string) => Transfer | null
  createTransfer: (data: {
    fromMaterialId: string
    toCabinet: string
    quantity: number
    handler: string
    reason: TransferReason
    remark: string
  }) => Transfer | null
  completeTransfer: (transferId: string) => void
  cancelTransfer: (transferId: string, cancelReason: string) => void
  createCheckTask: (data: { name: string; eventTime: string; responsible: string; materialIds: string[] }) => CheckTask
  updateCheckTask: (taskId: string, updates: Partial<Pick<CheckTask, 'name' | 'eventTime' | 'responsible' | 'materialIds'>>) => void
  updateCheckItem: (taskId: string, materialId: string, updates: Partial<Pick<CheckItem, 'actualQuantity' | 'suggestion' | 'checkNote'>>) => void
  completeCheckTask: (taskId: string) => void
  cancelCheckTask: (taskId: string) => void
  deleteCheckTask: (taskId: string) => void
  getCheckTask: (taskId: string) => CheckTask | undefined
  getActiveCheckTasks: () => CheckTask[]
  getMaterialCheckStatus: (materialId: string) => { taskId: string; taskName: string; status: CheckItemStatus } | null
  refreshCheckTaskItems: (taskId: string) => void
  syncTransferToCheckTask: (materialId: string) => void
}

const DEFAULT_FILTERS: FilterState = { cabinet: '', category: '', status: '', responsible: '' }

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      materials: INITIAL_MATERIALS,
      selectedIds: [],
      filters: { ...DEFAULT_FILTERS },
      preEventMode: false,
      onlyPendingTransfers: false,
      anomalies: detectAnomalies(INITIAL_MATERIALS),
      transfers: INITIAL_TRANSFERS,
      checkTasks: INITIAL_CHECK_TASKS,

      setMaterials: (materials) => set({ materials, anomalies: detectAnomalies(materials) }),

      addMaterial: (material) => {
        const newMaterial: Material = {
          ...material,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        }
        const materials = [...get().materials, newMaterial]
        set({ materials, anomalies: detectAnomalies(materials) })
      },

      updateMaterial: (id, updates) => {
        const materials = get().materials.map((m) =>
          m.id === id ? { ...m, ...updates, updatedAt: now() } : m
        )
        set({ materials, anomalies: detectAnomalies(materials) })
      },

      deleteMaterial: (id) => {
        const materials = get().materials.filter((m) => m.id !== id)
        const selectedIds = get().selectedIds.filter((sid) => sid !== id)
        set({ materials, selectedIds, anomalies: detectAnomalies(materials) })
      },

      deleteMaterials: (ids) => {
        const idSet = new Set(ids)
        const materials = get().materials.filter((m) => !idSet.has(m.id))
        const selectedIds = get().selectedIds.filter((sid) => !idSet.has(sid))
        set({ materials, selectedIds, anomalies: detectAnomalies(materials) })
      },

      toggleSelect: (id) => {
        const sel = get().selectedIds
        set({ selectedIds: sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id] })
      },

      toggleSelectAll: (ids) => {
        const sel = get().selectedIds
        const allSelected = ids.every((id) => sel.includes(id))
        if (allSelected) {
          const idSet = new Set(ids)
          set({ selectedIds: sel.filter((s) => !idSet.has(s)) })
        } else {
          const merged = new Set([...sel, ...ids])
          set({ selectedIds: Array.from(merged) })
        }
      },

      clearSelection: () => set({ selectedIds: [] }),

      batchSetStatus: (ids, status) => {
        const idSet = new Set(ids)
        const materials = get().materials.map((m) =>
          idSet.has(m.id) ? { ...m, status, updatedAt: now() } : m
        )
        set({ materials, anomalies: detectAnomalies(materials) })
      },

      setFilter: (key, value) => {
        set({ filters: { ...get().filters, [key]: value } })
      },

      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

      togglePreEventMode: () => set({ preEventMode: !get().preEventMode }),

      toggleOnlyPendingTransfers: () => set({ onlyPendingTransfers: !get().onlyPendingTransfers }),

      getFilteredMaterials: () => {
        const { materials, filters, onlyPendingTransfers, transfers } = get()
        const pendingTransferMaterialIds = new Set(
          transfers.filter((t) => t.status === '待处理').flatMap((t) => [t.fromMaterialId, t.toMaterialId].filter(Boolean))
        )
        return materials.filter((m) => {
          if (onlyPendingTransfers && !pendingTransferMaterialIds.has(m.id)) return false
          if (filters.cabinet && m.cabinet !== filters.cabinet) return false
          if (filters.category && m.category !== filters.category) return false
          if (filters.status && m.status !== filters.status) return false
          if (filters.responsible && m.responsible !== filters.responsible) return false
          return true
        })
      },

      getPreEventMaterials: () => {
        const filtered = get().getFilteredMaterials()
        const anomalyIds = get().getAnomalyMaterialIds()
        return filtered.filter((m) => m.quantity < m.threshold || anomalyIds.has(m.id))
      },

      getAnomalyMaterialIds: () => {
        const ids = new Set<string>()
        get().anomalies.forEach((a) => a.materialIds.forEach((id) => ids.add(id)))
        return ids
      },

      recalcAnomalies: () => {
        set({ anomalies: detectAnomalies(get().materials) })
      },

      getAvailableQuantity: (materialId) => {
        const material = get().materials.find((m) => m.id === materialId)
        if (!material) return 0
        const pendingOut = get()
          .transfers.filter((t) => t.fromMaterialId === materialId && t.status === '待处理')
          .reduce((sum, t) => sum + t.quantity, 0)
        return Math.max(0, material.quantity - pendingOut)
      },

      getPendingTransferQuantity: (materialId) => {
        const pendingIn = get()
          .transfers.filter((t) => t.toMaterialId === materialId && t.status === '待处理')
          .reduce((sum, t) => sum + t.quantity, 0)
        const pendingOut = get()
          .transfers.filter((t) => t.fromMaterialId === materialId && t.status === '待处理')
          .reduce((sum, t) => sum + t.quantity, 0)
        return pendingIn - pendingOut
      },

      getMaterialTransfers: (materialId) => {
        return get().transfers.filter((t) => t.fromMaterialId === materialId || t.toMaterialId === materialId)
      },

      getLatestTransfer: (materialId) => {
        const transfers = get().getMaterialTransfers(materialId)
        if (transfers.length === 0) return null
        return transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      },

      createTransfer: (data) => {
        const { materials } = get()
        const fromMaterial = materials.find((m) => m.id === data.fromMaterialId)
        if (!fromMaterial) return null

        const availableQty = get().getAvailableQuantity(data.fromMaterialId)
        if (data.quantity > availableQty) return null

        const toMaterial = materials.find((m) => m.cabinet === data.toCabinet && m.name === fromMaterial.name)

        const newTransfer: Transfer = {
          id: generateId(),
          materialName: fromMaterial.name,
          fromMaterialId: data.fromMaterialId,
          fromCabinet: fromMaterial.cabinet,
          toMaterialId: toMaterial?.id || null,
          toCabinet: data.toCabinet,
          quantity: data.quantity,
          handler: data.handler,
          reason: data.reason,
          remark: data.remark,
          status: '待处理',
          createdAt: now(),
          updatedAt: now(),
        }

        set({ transfers: [...get().transfers, newTransfer] })
        return newTransfer
      },

      completeTransfer: (transferId) => {
        const { transfers, materials } = get()
        const transfer = transfers.find((t) => t.id === transferId)
        if (!transfer || transfer.status !== '待处理') return

        let toMaterialId = transfer.toMaterialId
        const updatedMaterials = materials.map((m) => {
          if (m.id === transfer.fromMaterialId) {
            return { ...m, quantity: Math.max(0, m.quantity - transfer.quantity), updatedAt: now() }
          }
          if (m.id === transfer.toMaterialId) {
            return { ...m, quantity: m.quantity + transfer.quantity, updatedAt: now() }
          }
          return m
        })

        if (!transfer.toMaterialId) {
          const fromMaterial = materials.find((m) => m.id === transfer.fromMaterialId)
          if (fromMaterial) {
            const newMaterial: Material = {
              id: generateId(),
              name: fromMaterial.name,
              category: fromMaterial.category,
              cabinet: transfer.toCabinet,
              quantity: transfer.quantity,
              threshold: fromMaterial.threshold,
              responsible: fromMaterial.responsible,
              status: fromMaterial.status,
              replenishNote: '',
              remark: `从 ${transfer.fromCabinet} 调拨转入`,
              createdAt: now(),
              updatedAt: now(),
            }
            updatedMaterials.push(newMaterial)
            toMaterialId = newMaterial.id
          }
        }

        const updatedTransfers = transfers.map((t) =>
          t.id === transferId ? { ...t, status: '已完成' as TransferStatus, toMaterialId, completedAt: now(), updatedAt: now() } : t
        )

        set({ materials: updatedMaterials, transfers: updatedTransfers, anomalies: detectAnomalies(updatedMaterials) })
        get().syncTransferToCheckTask(transfer.fromMaterialId)
        if (transfer.toMaterialId) {
          get().syncTransferToCheckTask(transfer.toMaterialId)
        }
      },

      cancelTransfer: (transferId, cancelReason) => {
        const { transfers } = get()
        const transfer = transfers.find((t) => t.id === transferId)
        if (!transfer || transfer.status !== '待处理') return

        const updatedTransfers = transfers.map((t) =>
          t.id === transferId
            ? { ...t, status: '已取消' as TransferStatus, cancelledAt: now(), cancelReason, updatedAt: now() }
            : t
        )

        set({ transfers: updatedTransfers })
      },

      createCheckTask: (data) => {
        const { materials } = get()
        const anomalyIds = get().getAnomalyMaterialIds()
        const items = buildCheckItems(data.materialIds, materials, anomalyIds)
        const task: CheckTask = {
          id: generateId(),
          name: data.name,
          eventTime: data.eventTime,
          responsible: data.responsible,
          materialIds: data.materialIds,
          items,
          status: '进行中',
          createdAt: now(),
          updatedAt: now(),
        }
        set({ checkTasks: [...get().checkTasks, task] })
        return task
      },

      updateCheckTask: (taskId, updates) => {
        const { materials } = get()
        const anomalyIds = get().getAnomalyMaterialIds()
        const checkTasks = get().checkTasks.map((t) => {
          if (t.id !== taskId) return t
          const newMaterialIds = updates.materialIds ?? t.materialIds
          const existingItems = new Map(t.items.map((item) => [item.materialId, item]))
          const newItems = newMaterialIds.map((mid) => {
            if (existingItems.has(mid)) return existingItems.get(mid)!
            const material = materials.find((m) => m.id === mid)
            return {
              materialId: mid,
              actualQuantity: null,
              gapQuantity: material ? Math.max(0, material.threshold - material.quantity) : 0,
              suggestion: '',
              checkNote: '',
              status: computeCheckItemStatus(material, null, anomalyIds, mid),
            }
          })
          return {
            ...t,
            ...updates,
            materialIds: newMaterialIds,
            items: newItems,
            updatedAt: now(),
          }
        })
        set({ checkTasks })
      },

      updateCheckItem: (taskId, materialId, updates) => {
        const { materials } = get()
        const anomalyIds = get().getAnomalyMaterialIds()
        const checkTasks = get().checkTasks.map((t) => {
          if (t.id !== taskId) return t
          const items = t.items.map((item) => {
            if (item.materialId !== materialId) return item
            const actualQuantity = updates.actualQuantity !== undefined ? updates.actualQuantity : item.actualQuantity
            const material = materials.find((m) => m.id === materialId)
            const gapQuantity = actualQuantity !== null && material ? Math.max(0, material.threshold - actualQuantity) : item.gapQuantity
            const status = computeCheckItemStatus(material, actualQuantity, anomalyIds, materialId)
            return {
              ...item,
              ...(updates.actualQuantity !== undefined ? { actualQuantity } : {}),
              ...(updates.suggestion !== undefined ? { suggestion: updates.suggestion } : {}),
              ...(updates.checkNote !== undefined ? { checkNote: updates.checkNote } : {}),
              gapQuantity,
              status,
            }
          })
          return { ...t, items, updatedAt: now() }
        })
        set({ checkTasks })
      },

      completeCheckTask: (taskId) => {
        const checkTasks = get().checkTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: '已完成' as CheckTaskStatus, completedAt: now(), updatedAt: now() }
            : t
        )
        set({ checkTasks })
      },

      cancelCheckTask: (taskId) => {
        const checkTasks = get().checkTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: '已取消' as CheckTaskStatus, updatedAt: now() }
            : t
        )
        set({ checkTasks })
      },

      deleteCheckTask: (taskId) => {
        set({ checkTasks: get().checkTasks.filter((t) => t.id !== taskId) })
      },

      getCheckTask: (taskId) => {
        return get().checkTasks.find((t) => t.id === taskId)
      },

      getActiveCheckTasks: () => {
        return get().checkTasks.filter((t) => t.status === '进行中')
      },

      getMaterialCheckStatus: (materialId) => {
        const activeTasks = get().checkTasks.filter((t) => t.status === '进行中')
        for (const task of activeTasks) {
          const item = task.items.find((i) => i.materialId === materialId)
          if (item) {
            return { taskId: task.id, taskName: task.name, status: item.status }
          }
        }
        return null
      },

      refreshCheckTaskItems: (taskId) => {
        const { materials } = get()
        const anomalyIds = get().getAnomalyMaterialIds()
        const checkTasks = get().checkTasks.map((t) => {
          if (t.id !== taskId || t.status !== '进行中') return t
          const items = t.items.map((item) => {
            const material = materials.find((m) => m.id === item.materialId)
            if (!material) return item
            const gapQuantity = item.actualQuantity !== null
              ? Math.max(0, material.threshold - item.actualQuantity)
              : Math.max(0, material.threshold - material.quantity)
            const status = computeCheckItemStatus(material, item.actualQuantity, anomalyIds, item.materialId)
            return { ...item, gapQuantity, status }
          })
          return { ...t, items, updatedAt: now() }
        })
        set({ checkTasks })
      },

      syncTransferToCheckTask: (materialId) => {
        const { materials, checkTasks } = get()
        const anomalyIds = get().getAnomalyMaterialIds()
        const updatedTasks = checkTasks.map((t) => {
          if (t.status !== '进行中') return t
          const hasItem = t.items.some((i) => i.materialId === materialId)
          if (!hasItem) return t
          const items = t.items.map((item) => {
            if (item.materialId !== materialId) return item
            const material = materials.find((m) => m.id === materialId)
            if (!material) return item
            const gapQuantity = item.actualQuantity !== null
              ? Math.max(0, material.threshold - item.actualQuantity)
              : Math.max(0, material.threshold - material.quantity)
            const status = computeCheckItemStatus(material, item.actualQuantity, anomalyIds, materialId)
            return { ...item, gapQuantity, status }
          })
          return { ...t, items, updatedAt: now() }
        })
        set({ checkTasks: updatedTasks })
      },
    }),
    {
      name: 'material-inventory',
      partialize: (state) => ({
        materials: state.materials,
        filters: state.filters,
        preEventMode: state.preEventMode,
        transfers: state.transfers,
        checkTasks: state.checkTasks,
      }),
    }
  )
)
