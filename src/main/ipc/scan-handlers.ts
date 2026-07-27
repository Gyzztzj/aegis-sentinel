/**
 * 处理扫描相关事件
 */
import { ipcMain, dialog } from 'electron'
import { plugins } from '../plugins'
import { runScanner } from '../core/scanner'
import { IScanResult } from '../types'
import { writeFileSync } from 'fs'
import axios, { AxiosError } from 'axios'

export function registerScanHandlers(): void {
  // 选择文件夹
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // 开始扫描
  ipcMain.handle('start-scan', async (_event, projectPath: string) => {
    return await runScanner(projectPath, plugins)
  })

  // 导出报告
  ipcMain.handle('export-report', async (_event, props) => {
    const { results, aiAdvice } = props
    // 生成markdown内容
    let md = '# Aegis Sentinel 检测报告\n\n'
    md += `> 生成时间：${new Date().toLocaleString()}\n\n`
    md += '---\n\n'

    // 按等级分组
    const errors = results.filter((r) => r.level === 'error')
    const warnings = results.filter((r) => r.level === 'warning')
    const infos = results.filter((r) => r.level === 'info')

    md += `## 📊 概览\n\n`
    md += `| 等级 | 数量 |\n| --- | --- |\n`
    md += `| 🔴 高危 | ${errors.length} |\n`
    md += `| ⚠️ 警告 | ${warnings.length} |\n`
    md += `| ℹ️ 提示 | ${infos.length} |\n\n`

    if (errors.length > 0) {
      md += '## 🔴 高危问题\n\n'
      errors.forEach((r) => {
        md += `- **${r.plugin}**：${r.message}\n`
      })
      md += '\n'
    }
    if (warnings.length > 0) {
      md += '## ⚠️ 警告问题\n\n'
      warnings.forEach((r) => {
        md += `- **${r.plugin}**：${r.message}\n`
      })
      md += '\n'
    }
    if (infos.length > 0) {
      md += '## ℹ️ 提示信息\n\n'
      infos.forEach((r) => {
        md += `- **${r.plugin}**：${r.message}\n`
      })
    }

    if (aiAdvice) {
      md += '## 🤖 AI 优化建议\n\n'
      md += aiAdvice + '\n\n'
    }
    // 弹出保存对话框
    const saveResult = await dialog.showSaveDialog({
      defaultPath: `Aegis-检测报告-${Date.now()}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })

    if (!saveResult.canceled && saveResult.filePath) {
      writeFileSync(saveResult.filePath, md, 'utf-8')
      return { success: true, path: saveResult.filePath }
    }

    return { success: false }
  })

  // AI 优化建议
  ipcMain.handle('ai-analyze', async (_event, results: IScanResult[]) => {
    if (results.length === 0) {
      return '✅ 未发现风险项，无需优化建议。'
    }
    // 生成问题列表
    const problemList = results
      .map((r: IScanResult) => {
        return `[${r.level === 'error' ? '高危' : r.level === 'warning' ? '警告' : '提示'}] ${r.plugin}: ${r.message}`
      })
      .join('\n')
    // 构建 Prompt
    const prompt = `你是一位资深前端工程化专家。以下是 Aegis Sentinel 对一个前端项目的检测结果。请针对每个问题给出具体的优化建议，包括问题原因、解决方案、以及相关的代码示例（如适用）。用 Markdown 格式输出。
    ${problemList}`

    try {
      const response = await axios.post(
        'https://ark.cn-beijing.volces.com/api/v3/chat/completions', // 换成你用的 API 地址
        {
          model: 'doubao-seed-2-0-lite-260428', // 换成你用的模型名
          messages: [
            {
              role: 'system',
              content: '你是一个资深前端工程化专家，擅长诊断项目问题并给出可操作的优化建议。'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // 低温度，让回答更聚焦
          max_tokens: 2000
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.AI_API_KEY?.trim()}`, // 临时用环境变量
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data.choices[0].message.content
    } catch (error: unknown) {
      let errMsg = '未知错误'
      if (error instanceof Error) {
        errMsg = error.message
      }
      // 捕获axios专用错误，输出HTTP状态码
      const axiosErr = error as unknown as AxiosError
      if (axiosErr.isAxiosError) {
        const status = axiosErr.response?.status ?? '无状态码'
        const statusText = axiosErr.response?.statusText ?? ''
        errMsg = `接口请求失败，HTTP状态：${status} ${statusText}，错误详情：${errMsg}`
      }
      // 仅返回纯字符串，不带任何带循环引用的原生对象
      return `AI 调用失败：${errMsg}`
    }
  })
}
