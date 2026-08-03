import { basename, join } from 'path'
import { IScanPlugin, IScanResult } from '../types'
import { existsSync, readFileSync } from 'fs'

const configFiles = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.mts']

export const checkViteConfigPlugin: IScanPlugin = {
  name: 'Vite 配置检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    // 1、检查是否存在 Vite 配置文件
    let configFilePath = ''
    for (const file of configFiles) {
      const fullPath = join(projectPath, file)

      if (existsSync(fullPath)) {
        configFilePath = fullPath
        break
      }
    }

    if (!configFilePath) {
      results.push({
        plugin: this.name,
        level: 'info',
        message: '未发现 Vite 配置文件，如使用 Vite 请添加配置文件'
      })
      return results
    }

    const configFileName = basename(configFilePath)
    results.push({
      plugin: this.name,
      level: 'info',
      message: `检测到 Vite 配置文件：${configFileName}`
    })

    // 2、检查 Vite 依赖是否存在
    const pkgPath = join(projectPath, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

      if (allDeps.vite) {
        results.push({
          plugin: this.name,
          level: 'info',
          message: `已安装 vite ${allDeps.vite}`
        })
      } else {
        results.push({
          plugin: this.name,
          level: 'error',
          message: '项目中未安装 vite 依赖，请执行 npm install -D vite'
        })
      }
    }

    // 3. 读取配置文件内容，做文本模式匹配
    try {
      const content = readFileSync(configFilePath, 'utf-8')
      // 检查base路径
      if (!content.match(/base\s*:/)) {
        results.push({
          plugin: this.name,
          level: 'info',
          message: '未配置 base 选项，默认值为 /，如有部署在子路径则需调整'
        })
      } else {
        // 提取base路径值
        const baseMatch = content.match(/base\s*:\s*['"]([^'"]+)['"]/)
        if (baseMatch) {
          results.push({
            plugin: this.name,
            level: 'info',
            message: `base 路径配置为：${baseMatch[1]}`
          })
        }
      }

      // 检查resolve.alias是否存在
      if (content.includes('resolve') && content.includes('alias')) {
        results.push({
          plugin: this.name,
          level: 'info',
          message: '已配置 resolve.alias 路径别名'
        })
      } else {
        results.push({
          plugin: this.name,
          level: 'info',
          message: '未配置 resolve.alias，可配置路径别名如 @/ 简化导入'
        })
      }

      // 检查server:proxy是否存在
      if (content.includes('proxy')) {
        results.push({
          plugin: this.name,
          level: 'info',
          message: '已配置 server.proxy 代理'
        })
      }

      //检查build相关配置
      if (content.includes('build')) {
        // build.outDir
        if (!content.match(/outDir\s*:/)) {
          results.push({
            plugin: this.name,
            level: 'info',
            message: '未配置 build.outDir，默认输出到 dist'
          })
        }
        // build.target
        const targetMatch = content.match(/target\s*:\s*['"](es[0-9]+)['"]/)
        if (targetMatch) {
          results.push({
            plugin: this.name,
            level: 'warning',
            message: `build.target 配置为 ${targetMatch[1]}，建议升级至 es2020 以上以获得更好的构建性能`
          })
        }
        // build.minify
        if (!content.match(/minify\s*:/)) {
          results.push({
            plugin: this.name,
            level: 'info',
            message: '未显式配置 build.minify，默认使用 esbuild 压缩'
          })
        }
      }

      // 检查 define（环境变量注入）
      if (content.includes('define:')) {
        results.push({
          plugin: this.name,
          level: 'info',
          message: '已配置 define 全局常量替换'
        })
      }
    } catch {
      results.push({
        plugin: this.name,
        level: 'error',
        message: 'Vite 配置文件读取失败，请检查文件权限'
      })
    }

    return results
  }
}
