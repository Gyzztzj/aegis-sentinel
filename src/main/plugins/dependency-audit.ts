import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'
import { existsSync, readFileSync } from 'fs'
import axios from 'axios'

// 检查依赖包是否存在高危漏洞
async function checkVulnerability(depName: string, version: string): Promise<IScanResult[]> {
  try {
    const response = await axios.post('https://api.osv.dev/v1/query', {
      package: { name: depName, ecosystem: 'npm' },
      version: version
    })

    const vulns = response.data?.vulns || []
    return vulns.map((vuln) => ({
      plugin: '依赖审计',
      level: 'error' as const,
      message: `高危漏洞：${depName}@${version} - ${vuln.summary || vuln.id}（${vuln.id}），建议升级至修复版本`
    }))
  } catch {
    return [] // 请求失败静默处理，不阻断检测
  }
}

export const dependencyAuditPlugin: IScanPlugin = {
  name: '依赖审计',
  enabled: true,
  async run(projectPath: string): Promise<IScanResult[]> {
    const results: IScanResult[] = []
    const fileName = 'package.json'
    const filePath = join(projectPath, fileName)
    // 1. 检查 package.json 是否存在
    if (!existsSync(filePath)) {
      results.push({ plugin: this.name, level: 'error', message: `❌ 未找到 ${fileName} 文件` })
    }
    let fileContent
    try {
      fileContent = JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch {
      results.push({
        plugin: this.name,
        level: 'error',
        message: 'tsconfig.json 解析失败，请检查 JSON 格式'
      })
      return results
    }

    // 2、计算依赖包数量
    const allDeps = { ...fileContent.dependencies, ...fileContent.devDependencies }
    if (Object.keys(allDeps).length === 0) {
      results.push({
        plugin: this.name,
        level: 'warning',
        message: '项目没有任何依赖，可能是一个空项目'
      })
    }

    // 用于检测重复依赖
    const depNameCount = new Map<string, number>()

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      //  统计出现次数（重复依赖检查）
      depNameCount.set(depName, (depNameCount.get(depName) || 0) + 1)

      try {
        const { data } = await axios.get(`https://registry.npmjs.org/${depName}`)

        // 1、检查废弃包
        if (data?.deprecated) {
          results.push({
            plugin: this.name,
            level: 'warning',
            message: `废弃包：${depName} - ${data.deprecated}`
          })
        }

        // 2、检查高危漏洞
        const vulns = await checkVulnerability(depName, depVersion as string)
        results.push(...vulns)

        // 3、检查过期依赖
        const versions = Object.keys(data.versions)
        const latestVersion = versions[versions.length - 1] // 最新版本
        const currentVersion = (depVersion as string).replace('^', '').replace('~', '')
        if (currentVersion !== latestVersion) {
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

    // 3、检查重复依赖
    depNameCount.forEach((count, depName) => {
      if (count > 1) {
        results.push({
          plugin: this.name,
          level: 'warning',
          message: `重复依赖：${depName} 在 dependencies 和 devDependencies 中同时存在`
        })
      }
    })
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
