import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Material, FilterState, Anomaly, AnomalyType, MaterialStatus, Transfer, TransferStatus, TransferReason, CheckTask, CheckTaskItem, CheckTaskStatus, CheckItemStatus, CheckTaskScope, MaterialCategory } from '@/types'

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
  currentCheckTaskId: string | null

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

  createCheckTask: (data: {
    name: string
    eventTime: string
    responsible: string
    scope: CheckTaskScope
    scopeCategory?: MaterialCategory
    scopeCabinet?: string
    scopeMaterialIds?: string[]
    remark?: string
  }) => CheckTask | null
  updateCheckTask: (taskId: string, updates: Partial<CheckTask>) => void
  deleteCheckTask: (taskId: string) => void
  startCheckTask: (taskId: string) => void
  completeCheckTask: (taskId: string) => void
  cancelCheckTask: (taskId: string, reason: string) => void
  setCurrentCheckTaskId: (taskId: string | null) => void
  getCurrentCheckTask: () => CheckTask | null
  updateCheckTaskItem: (taskId: string, materialId: string, updates: Partial<CheckTaskItem>) => void
  recalcCheckTaskStats: (taskId: string) => void
  getMaterialCheckTasks: (materialId: string) => CheckTask[]
  getLatestCheckTaskItem: (materialId: string) => CheckTaskItem | null
  refreshCheckTaskGapStatus: (materialId: string) => void
}

const DEFAULT_FILTERS: FilterState = { cabinet: '', category: '', status: '', responsible: '' }

const INITIAL_CHECK_TASKS: CheckTask[] = []

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
      currentCheckTaskId: null,

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

        if (transfer.fromMaterialId) {
          get().refreshCheckTaskGapStatus(transfer.fromMaterialId)
        }
        if (toMaterialId) {
          get().refreshCheckTaskGapStatus(toMaterialId)
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

        if (transfer.fromMaterialId) {
          get().refreshCheckTaskGapStatus(transfer.fromMaterialId)
        }
        if (transfer.toMaterialId) {
          get().refreshCheckTaskGapStatus(transfer.toMaterialId)
        }
      },

      createCheckTask: (data) => {
        const { materials, getPendingTransferQuantity } = get()

        let scopeMaterials: Material[] = []
        switch (data.scope) {
          case '全部材料':
            scopeMaterials = [...materials]
            break
          case '按类别':
            if (data.scopeCategory) {
              scopeMaterials = materials.filter((m) => m.category === data.scopeCategory)
            }
            break
          case '按柜位':
            if (data.scopeCabinet) {
              scopeMaterials = materials.filter((m) => m.cabinet === data.scopeCabinet)
            }
            break
          case '指定材料':
            if (data.scopeMaterialIds) {
              const idSet = new Set(data.scopeMaterialIds)
              scopeMaterials = materials.filter((m) => idSet.has(m.id))
            }
            break
        }

        if (scopeMaterials.length === 0) return null

        const items: CheckTaskItem[] = scopeMaterials.map((m) => {
          const pendingQty = getPendingTransferQuantity(m.id)
          const effectiveQty = m.quantity + pendingQty
          const gapQty = Math.max(0, m.threshold - effectiveQty)

          return {
            materialId: m.id,
            materialName: m.name,
            category: m.category,
            cabinet: m.cabinet,
            systemQuantity: m.quantity,
            threshold: m.threshold,
            actualQuantity: null,
            gapQuantity: gapQty,
            handleSuggestion: gapQty > 0 ? '建议调拨或补料' : '',
            checkRemark: '',
            status: '未清点' as CheckItemStatus,
          }
        })

        const newTask: CheckTask = {
          id: generateId(),
          name: data.name,
          eventTime: data.eventTime,
          responsible: data.responsible,
          scope: data.scope,
          scopeCategory: data.scopeCategory,
          scopeCabinet: data.scopeCabinet,
          scopeMaterialIds: data.scopeMaterialIds,
          status: '待开始' as CheckTaskStatus,
          items,
          totalCount: items.length,
          checkedCount: 0,
          gapCount: items.filter((i) => i.gapQuantity > 0).length,
          resolvedCount: 0,
          remark: data.remark || '',
          createdAt: now(),
          updatedAt: now(),
        }

        const checkTasks = [...get().checkTasks, newTask]
        set({ checkTasks })
        return newTask
      },

      updateCheckTask: (taskId, updates) => {
        const checkTasks = get().checkTasks.map((t) =>
          t.id === taskId ? { ...t, ...updates, updatedAt: now() } : t
        )
        set({ checkTasks })
      },

      deleteCheckTask: (taskId) => {
        const checkTasks = get().checkTasks.filter((t) => t.id !== taskId)
        const currentCheckTaskId = get().currentCheckTaskId === taskId ? null : get().currentCheckTaskId
        set({ checkTasks, currentCheckTaskId })
      },

      startCheckTask: (taskId) => {
        const checkTasks = get().checkTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: '进行中' as CheckTaskStatus, startedAt: now(), updatedAt: now() }
            : t
        )
        set({ checkTasks, currentCheckTaskId: taskId })
      },

      completeCheckTask: (taskId) => {
        const checkTasks = get().checkTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: '已完成' as CheckTaskStatus, completedAt: now(), updatedAt: now() }
            : t
        )
        set({ checkTasks })
      },

      cancelCheckTask: (taskId, reason) => {
        const checkTasks = get().checkTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: '已取消' as CheckTaskStatus, cancelledAt: now(), remark: reason, updatedAt: now() }
            : t
        )
        const currentCheckTaskId = get().currentCheckTaskId === taskId ? null : get().currentCheckTaskId
        set({ checkTasks, currentCheckTaskId })
      },

      setCurrentCheckTaskId: (taskId) => {
        set({ currentCheckTaskId: taskId })
      },

      getCurrentCheckTask: () => {
        const { checkTasks, currentCheckTaskId } = get()
        if (!currentCheckTaskId) return null
        return checkTasks.find((t) => t.id === currentCheckTaskId) || null
      },

      updateCheckTaskItem: (taskId, materialId, updates) => {
        const { checkTasks, getPendingTransferQuantity } = get()
        const task = checkTasks.find((t) => t.id === taskId)
        if (!task) return

        const updatedItems = task.items.map((item) => {
          if (item.materialId !== materialId) return item

          const newItem = { ...item, ...updates, checkedAt: now() }

          if (updates.actualQuantity !== undefined) {
            const pendingQty = getPendingTransferQuantity(materialId)
            const effectiveQty = updates.actualQuantity + pendingQty
            const gapQty = Math.max(0, item.threshold - effectiveQty)
            newItem.gapQuantity = gapQty

            if (gapQty > 0) {
              newItem.status = '有缺口'
              if (!newItem.handleSuggestion) {
                newItem.handleSuggestion = '建议调拨或补料'
              }
            } else {
              newItem.status = '已清点'
            }
          }

          return newItem
        })

        const updatedTask = {
          ...task,
          items: updatedItems,
          updatedAt: now(),
        }

        const recalcStats = (t: CheckTask) => {
          const checkedCount = t.items.filter((i) => i.status !== '未清点').length
          const gapCount = t.items.filter((i) => i.status === '有缺口').length
          const resolvedCount = t.items.filter((i) => i.status === '已解决' || (i.status === '已清点' && i.gapQuantity === 0)).length
          return { ...t, checkedCount, gapCount, resolvedCount }
        }

        const finalTask = recalcStats(updatedTask)

        const updatedTasks = checkTasks.map((t) => (t.id === taskId ? finalTask : t))
        set({ checkTasks: updatedTasks })
      },

      recalcCheckTaskStats: (taskId) => {
        const { checkTasks, getPendingTransferQuantity } = get()
        const task = checkTasks.find((t) => t.id === taskId)
        if (!task) return

        const updatedItems = task.items.map((item) => {
          const pendingQty = getPendingTransferQuantity(item.materialId)
          const actualQty = item.actualQuantity ?? item.systemQuantity
          const effectiveQty = actualQty + pendingQty
          const gapQty = Math.max(0, item.threshold - effectiveQty)

          let newStatus = item.status
          if (item.status === '有缺口' && gapQty === 0) {
            newStatus = '已解决'
          } else if (item.status === '未清点' && gapQty === 0) {
            newStatus = '未清点'
          }

          return {
            ...item,
            gapQuantity: gapQty,
            status: newStatus,
          }
        })

        const checkedCount = updatedItems.filter((i) => i.status !== '未清点').length
        const gapCount = updatedItems.filter((i) => i.status === '有缺口').length
        const resolvedCount = updatedItems.filter((i) => i.status === '已解决' || (i.status === '已清点' && i.gapQuantity === 0)).length

        const updatedTask = {
          ...task,
          items: updatedItems,
          checkedCount,
          gapCount,
          resolvedCount,
          updatedAt: now(),
        }

        const updatedTasks = checkTasks.map((t) => (t.id === taskId ? updatedTask : t))
        set({ checkTasks: updatedTasks })
      },

      getMaterialCheckTasks: (materialId) => {
        return get().checkTasks.filter((t) => t.items.some((i) => i.materialId === materialId))
      },

      getLatestCheckTaskItem: (materialId) => {
        const tasks = get().getMaterialCheckTasks(materialId)
        if (tasks.length === 0) return null
        const sorted = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return sorted[0].items.find((i) => i.materialId === materialId) || null
      },

      refreshCheckTaskGapStatus: (materialId) => {
        const { checkTasks } = get()
        const taskIds = checkTasks.filter((t) => t.items.some((i) => i.materialId === materialId)).map((t) => t.id)
        taskIds.forEach((taskId) => {
          get().recalcCheckTaskStats(taskId)
        })
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
        currentCheckTaskId: state.currentCheckTaskId,
      }),
    }
  )
)
