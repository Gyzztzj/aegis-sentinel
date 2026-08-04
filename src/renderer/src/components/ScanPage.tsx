import React, { useRef, useEffect, useState } from 'react'
import { IScanResult } from '../types'
import { saveHistory } from '../utils/db'
import { IAppConfig } from '../utils/config-store'
import { Button } from './Button'
import { Card } from './Card'
import { ResultItem } from './ResultItem'
import { EmptyState } from './EmptyState'
import { Loading } from './Loading'
import { IpcRendererEvent } from 'electron'

interface ScanPageProps {
  projectPath: string
  setProjectPath: (path: string) => void
  results: IScanResult[]
  setResults: (results: IScanResult[]) => void
  scanning: boolean
  setScanning: (scanning: boolean) => void
  aiAdvice: string
  setAiAdvice: (advice: string | ((prev: string) => string)) => void
  aiLoading: boolean
  setAiLoading: (loading: boolean) => void
  config: IAppConfig | null
}

type FilterType = 'error' | 'warning' | 'info'

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
  const [activeFilter, setActiveFilter] = useState<FilterType>('error')
  const aiPanelScrollRef = useRef<HTMLDivElement>(null)

  const projectName = projectPath ? projectPath.split(/[/\\]/).pop() || projectPath : ''
  const projectFullPath = projectPath

  // AI流式输出时自动滚动到底部
  useEffect(() => {
    if (aiLoading && aiPanelScrollRef.current) {
      const el = aiPanelScrollRef.current
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }
  }, [aiAdvice, aiLoading])

  // 初始化时注册 IPC 监听
  useEffect(() => {
    const onChunk = (_event: IpcRendererEvent, data: { done: boolean; content: string }): void => {
      if (data.done) {
        setAiLoading(false)
      } else {
        setAiAdvice((prev: string) => prev + data.content)
      }
    }

    const onError = (_event: IpcRendererEvent, message: string): void => {
      setAiAdvice((prev: string) => prev + `\n\n❌ 错误：${message}`)
      setAiLoading(false)
    }

    window.electron.ipcRenderer.on('ai-stream-chunk', onChunk)
    window.electron.ipcRenderer.on('ai-stream-error', onError)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('ai-stream-chunk')
      window.electron.ipcRenderer.removeAllListeners('ai-stream-error')
    }
  }, [setAiAdvice, setAiLoading])

  const handleScan = async (): Promise<void> => {
    if (!projectPath) return
    setScanning(true)

    const res = await window.electron.ipcRenderer.invoke('start-scan', projectPath)

    setResults(res)
    setScanning(false)
    setActiveFilter('error')
    setAiAdvice('')

    try {
      await saveHistory({
        projectPath,
        projectName,
        results: res,
        aiAdvice: ''
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

    const advice = await window.electron.ipcRenderer.invoke(
      'ai-analyze-stream',
      results,
      config?.ai
    )

    setAiAdvice(advice)
    setAiLoading(false)
  }

  const errors = results.filter((r) => r.level === 'error')
  const warnings = results.filter((r) => r.level === 'warning')
  const infos = results.filter((r) => r.level === 'info')

  const getFilteredResults = (): IScanResult[] => {
    switch (activeFilter) {
      case 'error':
        return errors
      case 'warning':
        return warnings
      case 'info':
        return infos
      default:
        return []
    }
  }

  const hasResults = results.length > 0

  const renderResultsList = (): React.ReactNode => {
    const filtered = getFilteredResults()
    const filterLabels: Record<FilterType, { title: string; desc: string }> = {
      error: { title: '未发现高危问题', desc: '项目通过高危检测' },
      warning: { title: '未发现警告', desc: '项目通过警告检测' },
      info: { title: '无信息提示', desc: '项目状态良好' }
    }

    if (filtered.length === 0) {
      const label = filterLabels[activeFilter]
      return <EmptyState icon="✅" title={label.title} description={label.desc} />
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((result, index) => (
          <ResultItem key={`${result.plugin}-${result.message}-${index}`} result={result} />
        ))}
      </div>
    )
  }

  const renderStatsBar = (): React.ReactNode => (
    <div className="scan-stats-bar">
      <div
        className={`stat-item clickable ${activeFilter === 'error' ? 'active' : ''}`}
        onClick={() => setActiveFilter('error')}
      >
        <span className="stat-icon">🛑</span>
        <div>
          <div className="stat-label">高危问题</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {errors.length}
          </div>
        </div>
      </div>
      <div
        className={`stat-item clickable ${activeFilter === 'warning' ? 'active' : ''}`}
        onClick={() => setActiveFilter('warning')}
      >
        <span className="stat-icon">⚠️</span>
        <div>
          <div className="stat-label">警告提示</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {warnings.length}
          </div>
        </div>
      </div>
      <div
        className={`stat-item clickable ${activeFilter === 'info' ? 'active' : ''}`}
        onClick={() => setActiveFilter('info')}
      >
        <span className="stat-icon">ℹ️</span>
        <div>
          <div className="stat-label">信息提示</div>
          <div className="stat-value" style={{ color: '#0ea5e9' }}>
            {infos.length}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAIPanel = (): React.ReactNode => {
    return (
      <div className="ai-suggestions-area">
        <Card className="ai-panel-card">
          <div className="ai-panel-header">
            <div className="ai-panel-title-row">
              <span className="ai-panel-icon">🤖</span>
              <h3 className="ai-panel-title">AI 优化建议</h3>
              {aiLoading && (
                <span className="ai-panel-stream-indicator">
                  <span className="animate-spin-inline" />
                  分析中...
                </span>
              )}
              {!aiLoading && aiAdvice && (
                <span className="ai-panel-badge">
                  <span style={{ color: '#16a34a' }}>●</span> 已完成
                </span>
              )}
            </div>
            <div className="ai-panel-subtitle">
              {aiLoading
                ? '正在基于检测结果生成优化建议，请稍候...'
                : aiAdvice
                  ? '以下是基于检测结果生成的优化建议'
                  : '点击下方按钮，AI 将基于检测结果生成优化建议'}
            </div>
          </div>

          <div className="ai-panel-scroll" ref={aiPanelScrollRef}>
            {aiLoading ? (
              <div className="ai-panel-loading">
                <Loading text="AI 正在分析中，正在流式生成建议..." />
              </div>
            ) : aiAdvice ? (
              <div className="ai-panel-content">{aiAdvice}</div>
            ) : (
              <div className="ai-panel-empty">
                <div className="ai-panel-empty-icon">💡</div>
                <div className="ai-panel-empty-title">获取 AI 优化建议</div>
                <div className="ai-panel-empty-desc">
                  AI 将分析检测结果，为每个问题提供具体的优化建议，包括问题原因、解决方案和代码示例
                </div>
                <Button
                  onClick={handleAiAnalyze}
                  disabled={results.length === 0}
                  variant="accent"
                  size="md"
                >
                  🤖 开始 AI 分析
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="scan-page">
      {/* 操作区 - 固定不滚动 */}
      <div className="scan-action-bar">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* 统一项目选择组件 */}
            <button
              className={`project-selector ${projectPath ? 'selected' : ''}`}
              onClick={handleSelectFolder}
              title={projectFullPath || '点击选择项目路径'}
            >
              {projectPath ? (
                <div className="project-selector-content">
                  <div className="project-selector-header">
                    <span className="project-selector-icon">📁</span>
                    <span className="project-selector-name">{projectName}</span>
                  </div>
                  <div className="project-selector-path">{projectFullPath}</div>
                </div>
              ) : (
                <div className="project-selector-placeholder">
                  <span className="project-selector-icon">📂</span>
                  <span>选择项目路径</span>
                </div>
              )}
            </button>

            <Button onClick={handleScan} disabled={scanning || !projectPath} size="md">
              {scanning ? (
                <>
                  <span
                    className="animate-spin"
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%'
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
              size="md"
            >
              📄 导出报告
            </Button>
          </div>
        </Card>
      </div>

      {/* 主内容区 - 左右分栏 */}
      <div className="scan-main-content">
        {/* 左侧：检测结果 */}
        <div className="scan-results-area">
          {!hasResults ? (
            <div className="scan-empty-state">
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
            </div>
          ) : (
            <Card title="检测结果" className="scan-result-card">
              {renderStatsBar()}
              <div className="scan-results-scroll">{renderResultsList()}</div>
            </Card>
          )}
        </div>

        {/* 右侧：AI 优化建议 */}
        {hasResults && renderAIPanel()}
      </div>
    </div>
  )
}
