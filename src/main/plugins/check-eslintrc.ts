import { basename, extname, join } from 'path'
import { IScanPlugin, IScanResult } from '../types'
import { existsSync, readFileSync } from 'fs'

// 常见的eslint配置文件
const configFiles: string[] = [
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  '.eslintrc.json',
  '.eslintrc',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs'
]

export const checkEslintrcPlugin: IScanPlugin = {
  name: 'ESLint 配置检测',
  enabled: true,
  run(projectPath: string): IScanResult[] {
    const results: IScanResult[] = []

    //1、检测是否存在eslint配置文件
    let configFilePath = ''
    let configFormat = ''
    for (const file of configFiles) {
      const fullPath = join(projectPath, file)
      if (existsSync(fullPath)) {
        configFilePath = fullPath
        configFormat = extname(file) || file
        break
      }
    }
    // 检查 package.json 中的 eslintConfig
    const pkgPath = join(projectPath, 'package.json')
    let pkgEslintConfig = false
    if (!configFilePath && existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.eslintConfig) {
        pkgEslintConfig = true
        results.push({
          plugin: this.name,
          level: 'info',
          message: 'ESLint 配置位于 package.json 的 eslintConfig 字段中'
        })
      }
    }

    if (!configFilePath && !pkgEslintConfig) {
      results.push({
        plugin: this.name,
        level: 'warning',
        message: '未找到 ESLint 配置文件，建议添加以统一代码风格'
      })
      return results
    }

    //2、检查 eslint 依赖
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (!allDeps.eslint) {
        results.push({
          plugin: this.name,
          level: 'error',
          message: '项目中未安装 eslint 依赖，请执行 npm install -D eslint'
        })
      } else {
        results.push({
          plugin: this.name,
          level: 'info',
          message: `已安装 eslint ${allDeps.eslint}`
        })
      }
    }

    // 3. 分析配置文件内容（仅对 JSON 格式做深入分析）
    if (configFilePath && configFormat === '.json') {
      try {
        const configContent = readFileSync(configFilePath, 'utf-8')
        const config = JSON.parse(configContent)

        // 检查extends字段
        if (config.extends) {
          const extendsList = Array.isArray(config.extends) ? config.extends : [config.extends]
          const hasRecommended = extendsList.some(
            (e: string) =>
              e.includes('eslint:recommended') ||
              e.includes('plugin:') ||
              e.includes('/recommended')
          )
          if (hasRecommended) {
            results.push({
              plugin: this.name,
              level: 'info',
              message: `ESLint 配置继承了主流规范：${extendsList.join(', ')}`
            })
          } else {
            results.push({
              plugin: this.name,
              level: 'warning',
              message: 'ESLint 配置未继承任何主流规范，建议扩展 eslint:recommended'
            })
          }
        } else {
          results.push({
            plugin: this.name,
            level: 'warning',
            message: 'ESLint 配置中未指定 extends，可能缺少基本规则集'
          })
        }

        // 检查规则数量
        if (config.rules && Object.keys(config.rules).length < 5) {
          results.push({
            plugin: this.name,
            level: 'info',
            message: 'ESLint 规则数量较少，可能未启用足够的检查'
          })
        }

        // 从 eslint 依赖中获取已废弃的规则
        const deprecatedRules: string[] = (() => {
          try {
            const eslintPath = join(projectPath, 'node_modules', 'eslint')
            // 动态 require，避免 TypeScript 报类型错误
            const { Linter } = globalThis.require
              ? globalThis.require(eslintPath)
              : import(eslintPath)
            const linter = new Linter()
            const rules = linter.getRules()
            const result: string[] = []
            rules.forEach((rule, ruleName) => {
              if (rule.meta?.deprecated) {
                result.push(ruleName)
              }
            })
            return result
          } catch {
            // 兜底硬编码清单
            return [
              'no-native-reassign',
              'no-negated-in-lhs',
              'no-spaced-func',
              'prefer-reflect',
              'no-comma-dangle',
              'valid-jsdoc',
              'require-jsdoc'
            ]
          }
        })()

        // 检查废弃规则
        if (config.rules) {
          const rules = Object.keys(config.rules)
          const foundDeprecated = rules.filter((r) => deprecatedRules.includes(r))
          if (foundDeprecated.length > 0) {
            results.push({
              plugin: this.name,
              level: 'warning',
              message: `使用了已废弃的 ESLint 规则：${foundDeprecated.join(', ')}，建议移除或替换`
            })
          }
        }

        // 检查 parserOptions 中的 ecmaVersion 是否过低
        if (config.parserOptions?.ecmaVersion && config.parserOptions.ecmaVersion < 2018) {
          results.push({
            plugin: this.name,
            level: 'info',
            message: 'ESLint parserOptions.ecmaVersion 较低，建议升级至 2020 以上以支持现代语法'
          })
        }
      } catch {
        results.push({
          plugin: this.name,
          level: 'error',
          message: 'ESLint 配置文件格式错误，请检查文件内容'
        })
      }
    } else if ((configFilePath && configFormat === '.yaml') || configFormat === '.yml') {
      // 对 YAML 文件做简单检查（不解析，只检查文本内容）
      const content = readFileSync(configFilePath, 'utf-8')
      if (!content.includes('extends')) {
        results.push({
          plugin: this.name,
          level: 'warning',
          message: 'YAML 格式的 ESLint 配置中未找到 extends 字段，建议扩展推荐规则'
        })
      }
      results.push({
        plugin: this.name,
        level: 'info',
        message: `检测到 YAML 格式的 ESLint 配置文件：${basename(configFilePath)}`
      })
    } else if (configFilePath) {
      // JS 配置文件（.js, .cjs, .mjs）不做执行分析，仅确认存在
      results.push({
        plugin: this.name,
        level: 'info',
        message: `检测到 JS 格式的 ESLint 配置文件：${basename(configFilePath)}，无法深入解析规则`
      })
      // 简单检查文本中是否有 extends
      const content = readFileSync(configFilePath, 'utf-8')
      if (!content.includes('extends')) {
        results.push({
          plugin: this.name,
          level: 'warning',
          message: 'JS 配置中未找到 extends，建议扩展推荐规则集'
        })
      }
    }

    return results
  }
}
