import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'

export const checkBuildArtifactsPlugin: IScanPlugin = {
  name: '构建产物检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    // 1. 检查 .gitignore 里有没有 dist
    const gitignorePath = join(projectPath, '.gitignore')
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf-8')
      if (!gitignore.includes('dist')) {
        results.push({
          plugin: this.name,
          level: 'error',
          message: '.gitignore 中未包含 dist 目录，构建产物可能被提交到仓库'
        })
      }
      if (!gitignore.includes('node_modules')) {
        results.push({
          plugin: this.name,
          level: 'error',
          message: '.gitignore 中未包含 node_modules，依赖包可能被提交到仓库'
        })
      }
    }

    // 2. 检查 dist 目录大小
    const distPath = join(projectPath, 'dist')
    if (existsSync(distPath)) {
      const size = getDirSize(distPath)
      const sizeMB = (size / 1024 / 1024).toFixed(2)
      if (size > 10 * 1024 * 1024) {
        // 大于 10MB
        results.push({
          plugin: this.name,
          level: 'warning',
          message: `dist 目录大小为 ${sizeMB}MB，建议分析构建产物是否存在可优化的依赖`
        })
      } else {
        results.push({
          plugin: this.name,
          level: 'info',
          message: `dist 目录大小：${sizeMB}MB`
        })
      }
    } else {
      results.push({
        plugin: this.name,
        level: 'info',
        message: '未找到 dist 目录，项目可能尚未构建'
      })
    }

    return results
  }
}

// 辅助函数：递归计算目录大小
function getDirSize(dirPath: string): number {
  let size = 0
  const files = readdirSync(dirPath)
  files.forEach((file) => {
    const filePath = join(dirPath, file)
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      size += getDirSize(filePath)
    } else {
      size += stat.size
    }
  })
  return size
}
