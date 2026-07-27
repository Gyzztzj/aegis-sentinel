import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'

export const checkNodeVersionPlugin: IScanPlugin = {
  name: 'Node 版本管理检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    // 1. 检查 .nvmrc
    const nvmrcPath = join(projectPath, '.nvmrc')
    if (existsSync(nvmrcPath)) {
      const version = readFileSync(nvmrcPath, 'utf-8').trim()
      results.push({
        plugin: this.name,
        level: 'info',
        message: `.nvmrc 已配置，推荐 Node 版本：${version}`
      })
    } else {
      results.push({
        plugin: this.name,
        level: 'warning',
        message: '未配置 .nvmrc 文件，建议添加以统一团队的 Node 版本'
      })
    }

    // 2. 检查 package.json 的 engines 字段
    const pkgPath = join(projectPath, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.engines && pkg.engines.node) {
        results.push({
          plugin: this.name,
          level: 'info',
          message: `engines.node 已配置：${pkg.engines.node}`
        })
      } else {
        results.push({
          plugin: this.name,
          level: 'warning',
          message: 'package.json 中未配置 engines.node，建议添加以声明项目所需的 Node 版本'
        })
      }
    }

    return results
  }
}
