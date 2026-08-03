import { parentPort } from 'worker_threads'
import { plugins } from '../plugins'
import { runScanner } from '../core/scanner'

parentPort?.on('message', async (msg: { projectPath: string; enabledPluginNames: string[] }) => {
  try {
    const context = await runScanner(msg.projectPath, plugins, msg.enabledPluginNames)
    parentPort?.postMessage({ type: 'complete', results: context.results })
  } catch (error: unknown) {
    parentPort?.postMessage({ type: 'error', message: (error as Error).message || '未知错误' })
  }
})
