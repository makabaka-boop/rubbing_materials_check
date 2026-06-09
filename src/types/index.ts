export type MaterialStatus = '待补料' | '待清洁' | '可使用' | '停用'
export type MaterialCategory = '拓包' | '宣纸' | '墨垫' | '围裙' | '其他'

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  cabinet: string
  quantity: number
  threshold: number
  responsible: string
  status: MaterialStatus
  replenishNote: string
  remark: string
  createdAt: string
  updatedAt: string
}

export type AnomalyType = '低存量' | '同名重复' | '柜位冲突' | '责任人空缺'

export interface Anomaly {
  type: AnomalyType
  materialIds: string[]
  message: string
}

export interface FilterState {
  cabinet: string
  category: string
  status: string
  responsible: string
}

export type TransferStatus = '待处理' | '已完成' | '已取消'
export type TransferReason = '库存调拨' | '活动调配' | '临时借用' | '其他'

export interface Transfer {
  id: string
  materialName: string
  fromMaterialId: string
  fromCabinet: string
  toMaterialId: string | null
  toCabinet: string
  quantity: number
  handler: string
  reason: TransferReason
  remark: string
  status: TransferStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = ['拓包', '宣纸', '墨垫', '围裙', '其他']
export const MATERIAL_STATUSES: MaterialStatus[] = ['待补料', '待清洁', '可使用', '停用']
export const TRANSFER_STATUSES: TransferStatus[] = ['待处理', '已完成', '已取消']
export const TRANSFER_REASONS: TransferReason[] = ['库存调拨', '活动调配', '临时借用', '其他']

export const STATUS_COLORS: Record<MaterialStatus, string> = {
  '待补料': 'bg-vermilion/15 text-vermilion border-vermilion/30',
  '待清洁': 'bg-amber/15 text-amber border-amber/30',
  '可使用': 'bg-pine/15 text-pine border-pine/30',
  '停用': 'bg-ink-muted/15 text-ink-muted border-ink-muted/30',
}

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  '待处理': 'bg-amber/15 text-amber border-amber/30',
  '已完成': 'bg-pine/15 text-pine border-pine/30',
  '已取消': 'bg-ink-muted/15 text-ink-muted border-ink-muted/30',
}

export const ANOMALY_ICONS: Record<AnomalyType, string> = {
  '低存量': 'AlertTriangle',
  '同名重复': 'Copy',
  '柜位冲突': 'Layers',
  '责任人空缺': 'UserX',
}

export type CheckTaskStatus = '进行中' | '待复核' | '已完成' | '已取消'
export type CheckItemStatus = '待清点' | '正常' | '缺口' | '待调拨' | '已解决'
export type CheckSuggestion = '调拨' | '补料' | '清洁' | '其他'

export interface CheckTaskItem {
  materialId: string
  actualQuantity: number
  gapQuantity: number
  suggestion: CheckSuggestion
  note: string
  transferId?: string
  status: CheckItemStatus
  checkedAt?: string
}

export interface CheckTask {
  id: string
  name: string
  eventDate: string
  responsible: string
  categoryScope: MaterialCategory[]
  cabinetScope: string[]
  status: CheckTaskStatus
  items: CheckTaskItem[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export const CHECK_TASK_STATUSES: CheckTaskStatus[] = ['进行中', '待复核', '已完成', '已取消']
export const CHECK_ITEM_STATUSES: CheckItemStatus[] = ['待清点', '正常', '缺口', '待调拨', '已解决']
export const CHECK_SUGGESTIONS: CheckSuggestion[] = ['调拨', '补料', '清洁', '其他']

export const CHECK_TASK_STATUS_COLORS: Record<CheckTaskStatus, string> = {
  '进行中': 'bg-blue/15 text-blue border-blue/30',
  '待复核': 'bg-amber/15 text-amber border-amber/30',
  '已完成': 'bg-pine/15 text-pine border-pine/30',
  '已取消': 'bg-ink-muted/15 text-ink-muted border-ink-muted/30',
}

export const CHECK_ITEM_STATUS_COLORS: Record<CheckItemStatus, string> = {
  '待清点': 'bg-ink-muted/15 text-ink-muted border-ink-muted/30',
  '正常': 'bg-pine/15 text-pine border-pine/30',
  '缺口': 'bg-vermilion/15 text-vermilion border-vermilion/30',
  '待调拨': 'bg-amber/15 text-amber border-amber/30',
  '已解决': 'bg-pine/15 text-pine border-pine/30',
}
