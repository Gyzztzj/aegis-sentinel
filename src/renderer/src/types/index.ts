/**
 * 扫描结果项
 */
export interface IScanResult {
  plugin: string
  level: 'error' | 'info' | 'warning'
  message: string
}

/**
 * 扫描插件
 */
export interface IScanPlugin {
  name: string
  enabled: boolean
  run: (projectPath: string) => IScanResult[] | Promise<IScanResult[]>
}

/**
 * 历史记录项
 */
export interface IHistoryRecord {
  id: number
  projectPath: string
  projectName: string
  results: IScanResult[]
  aiAdvice: string
  createdAt: string
}
