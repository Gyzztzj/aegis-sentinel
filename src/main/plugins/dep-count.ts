/**
 * 依赖风险检测插件
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import axios from 'axios'
import { IScanResult, IScanPlugin } from '../types'

export const depCountPlugin: IScanPlugin = {
  name: '依赖风险检测',
  enabled: true,

  async run(projectPath: string): Promise<IScanResult[]> {
    const pkgPath = join(projectPath, 'package.json')
    const results: IScanResult[] = []

    if (!existsSync(pkgPath)) {
      return [{ plugin: this.name, level: 'error', message: '没有找到 package.json' }]
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

    if (Object.keys(allDeps).length === 0) {
      return [{ plugin: this.name, level: 'warning', message: '项目没有任何依赖' }]
    }

    // 用于检查重复依赖
    const depNameCount = new Map<string, number>()

    // 逐个检查每个依赖
    for (const [depName, depVersion] of Object.entries(allDeps)) {
      // 统计出现次数（重复依赖检查）
      depNameCount.set(depName, (depNameCount.get(depName) || 0) + 1)

      try {
        // 请求 npm registry
        const response = await axios.get(`https://registry.npmjs.org/${depName}`)
        const data = response.data

        // 1. 检查废弃包
        if (data.deprecated) {
          results.push({
            plugin: this.name,
            level: 'error',
            message: `废弃包：${depName} - ${data.deprecated}`
          })
        }

        // 高危版本清单（临时硬编码，后续可替换为 OSV API）
        const vulnerableRanges: Record<string, { range: string; cve: string; desc: string }> = {
          lodash: {
            range: '<4.17.21',
            cve: 'CVE-2021-23337',
            desc: '原型污染漏洞'
          },
          axios: {
            range: '<1.6.0',
            cve: 'CVE-2023-45857',
            desc: 'CSRF 令牌泄露'
          },
          moment: {
            range: '<2.29.4',
            cve: 'CVE-2022-24785',
            desc: '路径遍历漏洞'
          },
          'webpack-dev-server': {
            range: '<4.15.1',
            cve: 'CVE-2023-4863',
            desc: '任意文件读取漏洞'
          }
        }

        // 检查高危版本
        if (vulnerableRanges[depName]) {
          const vuln = vulnerableRanges[depName]
          const currentVersion = (depVersion as string).replace('^', '').replace('~', '')

          // 简单判断：当前版本是否在漏洞范围内
          if (currentVersion < vuln.range.replace('<', '').replace('<=', '')) {
            results.push({
              plugin: this.name,
              level: 'error',
              message: `🔴 高危漏洞：${depName}@${currentVersion} 存在 ${vuln.desc}（${vuln.cve}），建议升级至 ${vuln.range} 以上`
            })
          }
        }

        // 2. 检查过期依赖
        const versions = Object.keys(data.versions)
        const latestVersion = versions[versions.length - 1] // 最新版本
        const currentVersion = (depVersion as string).replace('^', '').replace('~', '')

        if (latestVersion !== currentVersion) {
          results.push({
            plugin: this.name,
            level: 'warning',
            message: `过期依赖：${depName} 当前 ${currentVersion}，最新 ${latestVersion}`
          })
        }
      } catch {
        results.push({
          plugin: this.name,
          level: 'warning',
          message: `无法检查 ${depName}，网络请求失败或包不存在`
        })
      }
    }

    // 3. 检查重复依赖
    depNameCount.forEach((count, depName) => {
      if (count > 1) {
        results.push({
          plugin: this.name,
          level: 'warning',
          message: `重复依赖：${depName} 在 dependencies 和 devDependencies 中同时存在`
        })
      }
    })

    // 如果没有任何问题
    if (results.length === 0) {
      results.push({
        plugin: this.name,
        level: 'info',
        message: `✅ 共检查 ${Object.keys(allDeps).length} 个依赖，未发现风险`
      })
    }

    return results
  }
}
