import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'

export const checkTsconfigPlugin: IScanPlugin = {
  name: 'TypeScript 配置检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []
    const tsconfigPath = join(projectPath, 'tsconfig.json')

    if (!existsSync(tsconfigPath)) {
      // 没有 tsconfig 不算错误，可能是纯 JS 项目
      return results
    }

    let tsconfig
    try {
      tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    } catch {
      results.push({
        plugin: this.name,
        level: 'error',
        message: 'tsconfig.json 解析失败，请检查 JSON 格式'
      })
      return results
    }

    const compilerOptions = tsconfig.compilerOptions || {}

    // 1. 是否开启 strict 模式
    if (!compilerOptions.strict) {
      results.push({
        plugin: this.name,
        level: 'warning',
        message: '建议开启 strict 模式，以获得更严格的类型检查'
      })
    }

    // 2. target 是否过于陈旧
    if (compilerOptions.target && ['ES3', 'ES5'].includes(compilerOptions.target)) {
      results.push({
        plugin: this.name,
        level: 'warning',
        message: `编译目标为 ${compilerOptions.target}，建议至少设置为 ES2016 以上`
      })
    }

    // 3. 是否配置了路径别名
    if (!compilerOptions.paths || Object.keys(compilerOptions.paths).length === 0) {
      results.push({
        plugin: this.name,
        level: 'info',
        message: '未配置路径别名（paths），可配置如 @/ 来简化导入路径'
      })
    }

    // 4. 检查 sourceMap
    if (!compilerOptions.sourceMap) {
      results.push({
        plugin: this.name,
        level: 'info',
        message: '未开启 sourceMap，建议在开发环境开启以便调试'
      })
    }

    if (results.length === 0) {
      results.push({
        plugin: this.name,
        level: 'info',
        message: '✅ TypeScript 配置规范，未发现明显问题'
      })
    }

    return results
  }
}
