import { existsSync } from 'fs'
import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'

const requiredFiles = [
  { name: 'README.md', level: 'warning' as const, desc: '缺少 README.md，建议补充项目说明文档' },
  { name: 'LICENSE', level: 'info' as const, desc: '缺少 LICENSE 文件，建议添加开源许可证' },
  { name: '.editorconfig', level: 'info' as const, desc: '缺少 .editorconfig，建议统一编辑器配置' },
  {
    name: '.gitignore',
    level: 'error' as const,
    desc: '缺少 .gitignore，可能导致 node_modules 等被提交到仓库'
  }
]

export const checkProjectStandardPlugin: IScanPlugin = {
  name: '项目规范检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    requiredFiles.forEach((file) => {
      const filePath = join(projectPath, file.name)
      if (!existsSync(filePath)) {
        results.push({
          plugin: this.name,
          level: file.level,
          message: file.desc
        })
      }
    })

    if (results.length === 0) {
      results.push({
        plugin: this.name,
        level: 'info',
        message: '✅ 项目基础规范文件齐全'
      })
    }

    return results
  }
}
