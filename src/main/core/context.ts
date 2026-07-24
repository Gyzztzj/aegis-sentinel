/**
 * 扫描上下文
 */
import { IScanResult } from '../types'

export interface IScanContext {
  projectPath: string
  results: IScanResult[]
  startTime: number
}

export function createContext(projectPath: string): IScanContext {
  return {
    projectPath,
    results: [],
    startTime: Date.now()
  }
}
