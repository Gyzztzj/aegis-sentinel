import { join } from 'path'
import { IScanPlugin, IScanResult } from '../types'
import { existsSync, readFileSync } from 'fs'
import axios from 'axios'

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
        message: 'package.json 解析失败，请检查 JSON 格式'
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
    const depEntries = Object.entries(allDeps)
    const networkResults = await Promise.all(
      depEntries.map(async ([depName, depVersion]) => {
        //  统计出现次数（重复依赖检查）
        depNameCount.set(depName, (depNameCount.get(depName) || 0) + 1)

        const itemResults: IScanResult[] = []
        const currentVersion = (depVersion as string).replace('^', '').replace('~', '')

        try {
          const { data } = await axios.get(`https://registry.npmjs.org/${depName}`)

          // 1、检查废弃包
          if (data.deprecated) {
            itemResults.push({
              plugin: '依赖风险检测',
              level: 'error',
              message: `废弃包：${depName} - ${data.deprecated}`
            })
          }

          const versions = Object.keys(data.versions)
          const latestVersion = versions[versions.length - 1]
          // 2、检查过期依赖
          if (latestVersion !== currentVersion) {
            itemResults.push({
              plugin: '依赖风险检测',
              level: 'warning',
              message: `过期依赖：${depName} 当前 ${currentVersion}，最新 ${latestVersion}`
            })
          }
          // 3、检查高危漏洞
          try {
            const vulnResponse = await axios.post('https://api.osv.dev/v1/query', {
              package: { name: depName, ecosystem: 'npm' },
              version: currentVersion
            })
            const vulns = vulnResponse.data?.vulns || []
            vulns.forEach((vuln) => {
              itemResults.push({
                plugin: '依赖风险检测',
                level: 'error',
                message: `高危漏洞：${depName}@${currentVersion} - ${vuln.summary || vuln.id}（${vuln.id}）`
              })
            })
          } catch {
            // 请求失败静默处理，不阻断检测
          }
        } catch {
          itemResults.push({
            plugin: '依赖风险检测',
            level: 'warning',
            message: `无法检查 ${depName}，网络请求失败或包不存在`
          })
        }
        return itemResults
      })
    )
    // 合并所有结果
    results.push(...networkResults.flat())

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
