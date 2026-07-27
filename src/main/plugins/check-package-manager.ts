import { existsSync } from 'fs'
import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'

export const checkPackageManagerPlugin: IScanPlugin = {
  name: '包管理器一致性检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    const lockFiles = [
      { file: 'package-lock.json', manager: 'npm' },
      { file: 'yarn.lock', manager: 'yarn' },
      { file: 'pnpm-lock.yaml', manager: 'pnpm' }
    ]

    const found: string[] = []

    lockFiles.forEach(({ file, manager }) => {
      if (existsSync(join(projectPath, file))) {
        found.push(manager)
      }
    })

    if (found.length === 0) {
      results.push({
        plugin: this.name,
        level: 'warning',
        message:
          '未找到任何锁文件（package-lock.json / yarn.lock / pnpm-lock.yaml），建议提交锁文件以锁定依赖版本'
      })
    } else if (found.length > 1) {
      results.push({
        plugin: this.name,
        level: 'error',
        message: `检测到多个包管理器的锁文件：${found.join('、')}，团队应统一使用同一个包管理器`
      })
    } else {
      results.push({
        plugin: this.name,
        level: 'info',
        message: `✅ 使用 ${found[0]} 作为包管理器，锁文件唯一`
      })
    }

    return results
  }
}
