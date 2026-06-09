import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Material, FilterState, Anomaly, AnomalyType, MaterialStatus, Transfer, TransferStatus, TransferReason, CheckTask, CheckTaskItem, CheckTaskStatus, CheckItemStatus, CheckSuggestion, MaterialCategory } from '@/types'

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
  activeCheckTaskId: string | null

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
    checkTaskId?: string
    checkTaskItemId?: string
  }) => Transfer | null
  completeTransfer: (transferId: string) => void
  cancelTransfer: (transferId: string, cancelReason: string) => void

  setActiveCheckTask: (taskId: string | null) => void
  createCheckTask: (data: {
    name: string
    eventDate: string
    responsible: string
    categoryScope: MaterialCategory[]
    cabinetScope: string[]
  }) => CheckTask
  updateCheckTaskItem: (taskId: string, materialId: string, updates: Partial<CheckTaskItem>) => void
  updateCheckTaskStatus: (taskId: string, status: CheckTaskStatus) => void
  deleteCheckTask: (taskId: string) => void
  getCheckTaskById: (taskId: string) => CheckTask | undefined
  getActiveCheckTask: () => CheckTask | undefined
  getTaskMaterials: (taskId: string) => Material[]
  getCheckTaskStats: (taskId: string) => {
    total: number
    pending: number
    normal: number
    gap: number
    pendingTransfer: number
    resolved: number
    totalGap: number
    resolvedGap: number
  }
  getMaterialCheckStatus: (materialId: string) => { taskId: string; status: CheckItemStatus } | null
  linkTransferToCheckItem: (transferId: string, taskId: string, materialId: string) => void
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
      activeCheckTaskId: null,

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

        if (data.checkTaskId && data.checkTaskItemId) {
          get().linkTransferToCheckItem(newTransfer.id, data.checkTaskId, data.checkTaskItemId)
        }

        return newTransfer
      },

      completeTransfer: (transferId) => {
        const { transfers, materials, checkTasks } = get()
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

        const updatedCheckTasks = checkTasks.map((task) => {
          const updatedItems = task.items.map((item) => {
            if (item.transferId === transferId) {
              const fromMat = updatedMaterials.find((m) => m.id === item.materialId)
              if (fromMat) {
                let effectiveQty = fromMat.quantity
                get()
                  .transfers.filter((t) => t.toMaterialId === item.materialId && t.status === '已完成')
                  .forEach((t) => { effectiveQty += t.quantity })
                if (toMaterialId && toMaterialId !== item.materialId) {
                  const toMat = updatedMaterials.find((m) => m.id === toMaterialId)
                  if (toMat) effectiveQty += toMat.quantity
                }
                if (effectiveQty >= fromMat.threshold) {
                  return { ...item, status: '已解决' as CheckItemStatus, gapQuantity: 0 }
                }
              }
              return item
            }
            return item
          })
          return { ...task, items: updatedItems, updatedAt: now() }
        })

        set({ materials: updatedMaterials, transfers: updatedTransfers, checkTasks: updatedCheckTasks, anomalies: detectAnomalies(updatedMaterials) })
      },

      cancelTransfer: (transferId, cancelReason) => {
        const { transfers, checkTasks } = get()
        const transfer = transfers.find((t) => t.id === transferId)
        if (!transfer || transfer.status !== '待处理') return

        const updatedTransfers = transfers.map((t) =>
          t.id === transferId
            ? { ...t, status: '已取消' as TransferStatus, cancelledAt: now(), cancelReason, updatedAt: now() }
            : t
        )

        const updatedCheckTasks = checkTasks.map((task) => {
          const updatedItems = task.items.map((item) => {
            if (item.transferId === transferId && item.status === '待调拨') {
              return { ...item, status: '缺口' as CheckItemStatus, transferId: undefined }
            }
            return item
          })
          return { ...task, items: updatedItems, updatedAt: now() }
        })

        set({ transfers: updatedTransfers, checkTasks: updatedCheckTasks })
      },

      setActiveCheckTask: (taskId) => set({ activeCheckTaskId: taskId }),

      createCheckTask: (data) => {
        const { materials } = get()
        const taskMaterials = materials.filter((m) => {
          const categoryMatch = data.categoryScope.length === 0 || data.categoryScope.includes(m.category)
          const cabinetMatch = data.cabinetScope.length === 0 || data.cabinetScope.includes(m.cabinet)
          return categoryMatch && cabinetMatch
        })

        const items: CheckTaskItem[] = taskMaterials.map((m) => {
          const pendingIn = get()
            .transfers.filter((t) => t.toMaterialId === m.id && t.status === '待处理')
            .reduce((sum, t) => sum + t.quantity, 0)
          const effectiveQty = m.quantity + pendingIn
          const gap = Math.max(0, m.threshold - effectiveQty)

          let status: CheckItemStatus = '待清点'
          if (gap <= 0) {
            status = '待清点'
          }

          return {
            materialId: m.id,
            actualQuantity: m.quantity,
            gapQuantity: gap,
            suggestion: gap > 0 ? '补料' : '其他',
            note: '',
            status,
          }
        })

        const newTask: CheckTask = {
          id: generateId(),
          name: data.name,
          eventDate: data.eventDate,
          responsible: data.responsible,
          categoryScope: data.categoryScope,
          cabinetScope: data.cabinetScope,
          status: '进行中',
          items,
          createdAt: now(),
          updatedAt: now(),
        }

        set({ checkTasks: [...get().checkTasks, newTask] })
        return newTask
      },

      updateCheckTaskItem: (taskId, materialId, updates) => {
        const { checkTasks, materials } = get()
        let shouldUpdateMaterialNote = false
        let newNoteValue = ''

        const updatedTasks = checkTasks.map((task) => {
          if (task.id !== taskId) return task
          const updatedItems = task.items.map((item) => {
            if (item.materialId !== materialId) return item

            const newItem = { ...item, ...updates, checkedAt: now() }
            const material = materials.find((m) => m.id === materialId)
            if (material) {
              const pendingIn = get()
                .transfers.filter((t) => t.toMaterialId === materialId && t.status === '待处理')
                .reduce((sum, t) => sum + t.quantity, 0)
              const effectiveQty = newItem.actualQuantity + pendingIn
              const gap = Math.max(0, material.threshold - effectiveQty)
              newItem.gapQuantity = gap

              if (!updates.status || updates.status === item.status) {
                if (newItem.transferId) {
                  newItem.status = gap <= 0 ? '已解决' : '待调拨'
                } else if (gap <= 0) {
                  newItem.status = '正常'
                } else {
                  newItem.status = '缺口'
                }
              }

              if (newItem.suggestion === '补料' && newItem.note && material.replenishNote !== newItem.note) {
                shouldUpdateMaterialNote = true
                newNoteValue = newItem.note
              }
            }
            return newItem
          })
          return { ...task, items: updatedItems, updatedAt: now() }
        })

        set({ checkTasks: updatedTasks })

        if (shouldUpdateMaterialNote) {
          get().updateMaterial(materialId, { replenishNote: newNoteValue })
        }
      },

      updateCheckTaskStatus: (taskId, status) => {
        const updatedTasks = get().checkTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
                completedAt: status === '已完成' ? now() : undefined,
                updatedAt: now(),
              }
            : task
        )
        set({ checkTasks: updatedTasks })
      },

      deleteCheckTask: (taskId) => {
        set({
          checkTasks: get().checkTasks.filter((t) => t.id !== taskId),
          activeCheckTaskId: get().activeCheckTaskId === taskId ? null : get().activeCheckTaskId,
        })
      },

      getCheckTaskById: (taskId) => {
        return get().checkTasks.find((t) => t.id === taskId)
      },

      getActiveCheckTask: () => {
        const { checkTasks, activeCheckTaskId } = get()
        if (!activeCheckTaskId) return undefined
        return checkTasks.find((t) => t.id === activeCheckTaskId)
      },

      getTaskMaterials: (taskId) => {
        const task = get().getCheckTaskById(taskId)
        if (!task) return []
        const itemIds = new Set(task.items.map((i) => i.materialId))
        return get().materials.filter((m) => itemIds.has(m.id))
      },

      getCheckTaskStats: (taskId) => {
        const task = get().getCheckTaskById(taskId)
        if (!task) {
          return { total: 0, pending: 0, normal: 0, gap: 0, pendingTransfer: 0, resolved: 0, totalGap: 0, resolvedGap: 0 }
        }
        const stats = {
          total: task.items.length,
          pending: 0,
          normal: 0,
          gap: 0,
          pendingTransfer: 0,
          resolved: 0,
          totalGap: 0,
          resolvedGap: 0,
        }
        task.items.forEach((item) => {
          switch (item.status) {
            case '待清点': stats.pending++; break
            case '正常': stats.normal++; break
            case '缺口': stats.gap++; stats.totalGap += item.gapQuantity; break
            case '待调拨': stats.pendingTransfer++; stats.totalGap += item.gapQuantity; break
            case '已解决': stats.resolved++; stats.resolvedGap += item.gapQuantity; break
          }
        })
        return stats
      },

      getMaterialCheckStatus: (materialId) => {
        const { checkTasks } = get()
        for (const task of checkTasks) {
          if (task.status === '已完成' || task.status === '已取消') continue
          const item = task.items.find((i) => i.materialId === materialId)
          if (item) {
            return { taskId: task.id, status: item.status }
          }
        }
        return null
      },

      linkTransferToCheckItem: (transferId, taskId, materialId) => {
        const updatedTasks = get().checkTasks.map((task) => {
          if (task.id !== taskId) return task
          const updatedItems = task.items.map((item) => {
            if (item.materialId !== materialId) return item
            return { ...item, transferId, status: '待调拨' as CheckItemStatus }
          })
          return { ...task, items: updatedItems, updatedAt: now() }
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
