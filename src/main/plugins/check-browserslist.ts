import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'
import { existsSync, readFileSync } from 'fs'

export const checkBrowserslistPlugin: IScanPlugin = {
  name: '浏览器兼容性检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    // 1. 检查 package.json 里的 browserslist 字段
    const pkgPath = join(projectPath, 'package.json')
    let hasBrowserslist = false

    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.browserslist && pkg.browserslist.length > 0) {
        hasBrowserslist = true
        results.push({
          plugin: this.name,
          level: 'info',
          message: `已配置 browserslist：${Array.isArray(pkg.browserslist) ? pkg.browserslist.join(', ') : pkg.browserslist}`
        })
      }
    }

    // 2. 检查独立的 .browserslistrc 文件
    const rcPath = join(projectPath, '.browserslistrc')
    if (existsSync(rcPath)) {
      hasBrowserslist = true
      const content = readFileSync(rcPath, 'utf-8').trim()
      results.push({
        plugin: this.name,
        level: 'info',
        message: `.browserslistrc 已配置：${content.split('\n').join(', ')}`
      })
    }

    // 3. 如果都没有配置
    if (!hasBrowserslist) {
      results.push({
        plugin: this.name,
        level: 'warning',
        message: '未配置 browserslist，建议添加以明确浏览器支持范围，避免生成不必要的 polyfill'
      })
    }

    return results
  }
}
