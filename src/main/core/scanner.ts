/**
 * 运行扫描器
 */
import { IScanPlugin } from '../types'
import { createContext, IScanContext } from './context'

export async function runScanner(
  projectPath: string,
  plugins: IScanPlugin[],
  enabledPluginNames: string[]
): Promise<IScanContext> {
  const ctx = createContext(projectPath)
  // 按主进程传递的启用列表过滤插件，而非读取插件自身 enabled 属性
  const enabledPluginSet = new Set(enabledPluginNames)
  const enabledPlugins = plugins.filter((p) => enabledPluginSet.has(p.name))

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
