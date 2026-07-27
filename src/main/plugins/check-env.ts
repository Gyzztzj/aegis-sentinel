import { IScanPlugin, IScanResult } from '../types'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'

export const checkEnvPlugin: IScanPlugin = {
  name: '环境变量检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []
    const envPath = join(projectPath, '.env')

    if (!existsSync(envPath)) {
      // 没找到 .env 文件本身不算问题，很多项目不用
      return results
    }

    const content = readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')

    // 1. 检查是否有明文密钥模式
    const secretPatterns = [/(SECRET|KEY|TOKEN|PASSWORD|PWD)\s*=\s*['"][^'"]+['"]/gi]

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || trimmed === '') return // 跳过注释和空行

      secretPatterns.forEach((pattern) => {
        if (pattern.test(trimmed)) {
          const varName = trimmed.split('=')[0].trim()
          results.push({
            plugin: '环境变量检测',
            level: 'error',
            message: `第 ${index + 1} 行：${varName} 疑似包含明文密钥，请确认是否应该提交到版本控制`
          })
        }
      })
    })

    // 2. 检查常见必填变量是否存在
    const requiredVars = ['NODE_ENV', 'VITE_API_BASE']
    requiredVars.forEach((varName) => {
      if (!content.includes(`${varName}=`)) {
        results.push({
          plugin: '环境变量检测',
          level: 'warning',
          message: `建议配置 ${varName} 环境变量`
        })
      }
    })

    return results
  }
}
