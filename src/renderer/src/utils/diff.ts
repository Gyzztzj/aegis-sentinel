import { IHistoryRecord } from '@renderer/types'

export interface IDiffItem {
  message: string // 问题描述
  plugin: string // 来源插件
  level: string // 严重等级
  status: 'added' | 'removed' | 'unchanged' | 'level-changed'
  oldLevel?: string // 等级变化时的旧等级
}

export function compareReports(oldRecord: IHistoryRecord, newRecord: IHistoryRecord): IDiffItem[] {
  const diffResults: IDiffItem[] = []
  // 用 "plugin::message" 作为唯一标识
  const makeKey = (r: { plugin: string; message: string }): string => `${r.plugin}::${r.message}`

  const oldMap = new Map<string, { level: string }>()
  oldRecord.results.forEach((r) => {
    oldMap.set(makeKey(r), { level: r.level })
  })

  const newMap = new Map<string, { level: string }>()
  newRecord.results.forEach((r) => {
    newMap.set(makeKey(r), { level: r.level })
  })

  // 遍历新报告，找新增和等级变化
  newRecord.results.forEach((r) => {
    const key = makeKey(r)
    const oldItem = oldMap.get(key)
    if (!oldItem) {
      diffResults.push({ message: r.message, plugin: r.plugin, level: r.level, status: 'added' })
    } else if (oldItem.level !== r.level) {
      diffResults.push({
        message: r.message,
        plugin: r.plugin,
        level: r.level,
        status: 'level-changed',
        oldLevel: oldItem.level
      })
    } else {
      diffResults.push({
        message: r.message,
        plugin: r.plugin,
        level: r.level,
        status: 'unchanged'
      })
    }
  })

  // 遍历旧报告，找已修复（旧有但新无）
  oldRecord.results.forEach((r) => {
    const key = makeKey(r)
    if (!newMap.has(key)) {
      diffResults.push({ message: r.message, plugin: r.plugin, level: r.level, status: 'removed' })
    }
  })

  return diffResults
}
