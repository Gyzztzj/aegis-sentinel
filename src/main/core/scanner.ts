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
  // 过滤启用的插件
  const enabledPlugins = plugins.filter((p) => p.enabled)

  // 并行运行
  const resultsArrays = await Promise.all(
    enabledPlugins.map(async (plugin) => {
      try {
        return await plugin.run(projectPath)
      } catch (error: unknown) {
        return [
          {
            plugin: plugin.name,
            level: 'error' as const,
            message: `插件执行异常：${(error as Error).message || '未知错误'}`
          }
        ]
      }
    })
  )

  // 合并结果
  ctx.results.push(...resultsArrays.flat())

  return ctx
}
