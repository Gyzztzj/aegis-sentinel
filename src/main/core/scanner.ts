/**
 * 处理扫描相关事件
 */
import { IScanPlugin } from '../types'
import { createContext, IScanContext } from './context'

export async function runScanner(
  projectPath: string,
  plugins: IScanPlugin[]
): Promise<IScanContext> {
  const ctx = createContext(projectPath)

  for (const plugin of plugins) {
    if (!plugin.enabled) {
      continue
    }

    try {
      const results = await plugin.run(ctx.projectPath)
      ctx.results.push(...results)
    } catch (error: unknown) {
      ctx.results.push({
        plugin: plugin.name,
        level: 'error',
        message: `插件执行异常：${error instanceof Error ? error.message : '未知错误'}`
      })
    }
  }

  return ctx
}
