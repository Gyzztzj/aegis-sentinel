import React, { useState } from 'react'
import { IScanResult } from '../types'
import { saveHistory } from '../utils/db'
import { IAppConfig } from '../utils/config-store'
import { Button } from './Button'
import { Card } from './Card'
import { ResultItem } from './ResultItem'
import { EmptyState } from './EmptyState'
import { Loading } from './Loading'
import { Tabs } from './Tabs'

interface ScanPageProps {
  projectPath: string
  setProjectPath: (path: string) => void
  results: IScanResult[]
  setResults: (results: IScanResult[]) => void
  scanning: boolean
  setScanning: (scanning: boolean) => void
  aiAdvice: string
  setAiAdvice: (advice: string) => void
  aiLoading: boolean
  setAiLoading: (loading: boolean) => void
  config: IAppConfig | null
}

export function ScanPage({
  projectPath,
  setProjectPath,
  results,
  setResults,
  scanning,
  setScanning,
  aiAdvice,
  setAiAdvice,
  aiLoading,
  setAiLoading,
  config
}: ScanPageProps): React.ReactNode {
  const [activeTab, setActiveTab] = useState('all')

  const handleScan = async (): Promise<void> => {
    if (!projectPath) return
    setScanning(true)

    const res = await window.electron.ipcRenderer.invoke('start-scan', projectPath)

    setResults(res)
    setScanning(false)
    setActiveTab('all')

    // 提取项目名称
    const projectName = projectPath.split(/[/\\]/).pop() || projectPath

    // 存入indexDB
    try {
      await saveHistory({
        projectPath,
        projectName,
        results: res,
        createdAt: String(Date.now()),
        aiAdvice
      })
    } catch (error) {
      console.error('存储历史记录失败:', error)
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    const path = await window.electron.ipcRenderer.invoke('select-folder')
    if (path) {
      setProjectPath(path)
      setResults([])
      setAiAdvice('')
    }
  }

  const handleExportReport = async (): Promise<void> => {
    const res = await window.electron.ipcRenderer.invoke('export-report', {
      results,
      aiAdvice
    })
    if (res.success) {
      alert(`报告已导出到 ${res.path}`)
    }
  }

  const handleAiAnalyze = async (): Promise<void> => {
    setAiLoading(true)
    setAiAdvice('')
    const advice = await window.electron.ipcRenderer.invoke('ai-analyze', results, config?.ai)

    setAiAdvice(advice)
    setAiLoading(false)
    setActiveTab('ai')
  }

  const errors = results.filter((r) => r.level === 'error')
  const warnings = results.filter((r) => r.level === 'warning')
  const infos = results.filter((r) => r.level === 'info')

  const tabs = [
    {
      id: 'all',
      label: '全部',
      icon: '📋',
      badge: results.length,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {errors.map((result) => (
            <ResultItem key={`error-${result.plugin}-${result.message}`} result={result} />
          ))}
          {warnings.map((result) => (
            <ResultItem key={`warning-${result.plugin}-${result.message}`} result={result} />
          ))}
          {infos.map((result) => (
            <ResultItem key={`info-${result.plugin}-${result.message}`} result={result} />
          ))}
          {results.length === 0 && (
            <EmptyState icon="✅" title="检测完成" description="项目未发现任何问题" />
          )}
        </div>
      )
    },
    {
      id: 'error',
      label: '高危问题',
      icon: '🛑',
      badge: errors.length,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {errors.map((result) => (
            <ResultItem key={`error-${result.plugin}-${result.message}`} result={result} />
          ))}
          {errors.length === 0 && (
            <EmptyState icon="✅" title="未发现高危问题" description="项目通过高危检测" />
          )}
        </div>
      )
    },
    {
      id: 'warning',
      label: '警告提示',
      icon: '⚠️',
      badge: warnings.length,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {warnings.map((result) => (
            <ResultItem key={`warning-${result.plugin}-${result.message}`} result={result} />
          ))}
          {warnings.length === 0 && (
            <EmptyState icon="✅" title="未发现警告" description="项目通过警告检测" />
          )}
        </div>
      )
    },
    {
      id: 'info',
      label: '信息提示',
      icon: 'ℹ️',
      badge: infos.length,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {infos.map((result) => (
            <ResultItem key={`info-${result.plugin}-${result.message}`} result={result} />
          ))}
          {infos.length === 0 && (
            <EmptyState icon="✅" title="无信息提示" description="项目状态良好" />
          )}
        </div>
      )
    },
    {
      id: 'ai',
      label: 'AI优化建议',
      icon: '🤖',
      badge: aiAdvice ? 1 : 0,
      children: (
        <div>
          {aiLoading ? (
            <Loading text="AI正在分析中，请稍候..." />
          ) : aiAdvice ? (
            <div className="ai-advice-card" style={{ margin: 0 }}>
              <div className="ai-advice-header">
                <span className="ai-advice-icon">🤖</span>
                <h3 className="ai-advice-title">AI 优化建议</h3>
              </div>
              <div className="ai-advice-content">{aiAdvice}</div>
            </div>
          ) : (
            <EmptyState
              icon="💡"
              title="获取AI优化建议"
              description="点击右上角「AI优化建议」按钮，获取专业的代码优化建议"
            />
          )}
        </div>
      )
    }
  ]

  return (
    <div className="content-body">
      {/* 操作栏 */}
      <div className="section">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Button onClick={handleSelectFolder} variant="secondary" size="lg">
              📂 选择项目路径
            </Button>
            {projectPath && (
              <div
                className="stat-item"
                style={{ flex: 1, minWidth: '200px', justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📁</span>
                  <span className="stat-label">当前项目</span>
                </span>
                <span className="stat-value" style={{ fontSize: '14px', fontWeight: '500' }}>
                  {projectPath.split(/[/\\]/).pop()}
                </span>
              </div>
            )}
            <Button onClick={handleScan} disabled={scanning || !projectPath} size="lg">
              {scanning ? (
                <>
                  <span
                    className="animate-spin"
                    style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      fontSize: '12px'
                    }}
                  />
                  扫描中...
                </>
              ) : (
                '🚀 开始检测'
              )}
            </Button>
            <Button
              onClick={handleExportReport}
              disabled={scanning || !projectPath}
              variant="secondary"
              size="lg"
            >
              📄 导出报告
            </Button>
            <Button
              onClick={handleAiAnalyze}
              disabled={results.length === 0 || aiLoading}
              variant="accent"
              size="lg"
            >
              {aiLoading ? (
                <>
                  <span
                    className="animate-spin"
                    style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      fontSize: '12px'
                    }}
                  />
                  AI分析中...
                </>
              ) : (
                '🤖 AI 优化建议'
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* 统计数据 */}
      {results.length > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">🛑</span>
            <div>
              <div className="stat-label">高危问题</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {errors.length}
              </div>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⚠️</span>
            <div>
              <div className="stat-label">警告提示</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {warnings.length}
              </div>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">ℹ️</span>
            <div>
              <div className="stat-label">信息提示</div>
              <div className="stat-value" style={{ color: '#0ea5e9' }}>
                {infos.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 扫描结果 */}
      <div className="section">
        {results.length === 0 ? (
          <Card>
            {scanning ? (
              <Loading text="正在扫描项目，请稍候..." />
            ) : (
              <EmptyState
                icon="🔍"
                title="开始项目检测"
                description="选择项目路径后点击「开始检测」按钮，Aegis Sentinel 将对项目进行全面体检"
              />
            )}
          </Card>
        ) : (
          <Card
            title="检测结果"
            headerRight={
              <Button onClick={handleAiAnalyze} disabled={aiLoading} variant="accent" size="sm">
                {aiLoading ? (
                  <span
                    className="animate-spin"
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '1px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  '🤖 获取建议'
                )}
              </Button>
            }
          >
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </Card>
        )}
      </div>
    </div>
  )
}
