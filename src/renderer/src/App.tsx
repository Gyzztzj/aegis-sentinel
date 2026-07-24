import { useState } from 'react'

interface IScanResult {
  plugin: string
  level: 'error' | 'info' | 'warning'
  message: string
}

function App(): React.ReactNode {
  const [projectPath, setProjectPath] = useState<string>('')
  const [results, setResults] = useState<IScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)

  const handleScan = async (): Promise<void> => {
    setScanning(true)

    const res = await window.electron.ipcRenderer.invoke('start-scan', projectPath)

    setResults(res.results)

    setScanning(false)
  }

  // 选择项目路径
  const handleSelectFolder = async (): Promise<void> => {
    const path = await window.electron.ipcRenderer.invoke('select-folder')
    if (path) {
      setProjectPath(path)
      setResults([]) // 清空旧结果
    }
  }

  // 导出报告
  const handleExportReport = async (): Promise<void> => {
    const res = await window.electron.ipcRenderer.invoke('export-report', results)
    if (res.success) {
      alert(`报告已导出到 ${res.path}`)
    }
  }

  // AI 分析
  const handleAiAnalyze = async (): Promise<void> => {
    setAiLoading(true)
    setAiAdvice('')
    const advice = await window.electron.ipcRenderer.invoke('ai-analyze', results)
    setAiAdvice(advice)
    setAiLoading(false)
  }

  const errors = results.filter((r) => r.level === 'error')
  const warnings = results.filter((r) => r.level === 'warning')
  const infos = results.filter((r) => r.level === 'info')

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Aegis Sentinel</h1>
      <button disabled={scanning} onClick={handleSelectFolder}>
        选择项目路径
      </button>
      {projectPath && (
        <span
          style={{
            display: 'inline-block',
            marginLeft: 12,
            marginRight: 16,
            color: '#6B7280',
            fontSize: 14
          }}
        >
          📁 {projectPath}
        </span>
      )}
      <button
        disabled={scanning || !projectPath}
        onClick={handleScan}
        style={{ padding: '8px 16px', marginBottom: 16 }}
      >
        {scanning ? '扫描中...' : '开始检测'}
      </button>
      <button
        disabled={scanning || !projectPath}
        onClick={handleExportReport}
        style={{ padding: '8px 16px', marginLeft: 16, marginBottom: 16 }}
      >
        导出报告
      </button>
      <button
        disabled={results.length === 0 || aiLoading}
        onClick={handleAiAnalyze}
        style={{
          padding: '8px 16px',
          background: '#8B5CF6',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: results.length === 0 ? 'not-allowed' : 'pointer',
          opacity: results.length === 0 ? 0.5 : 1,
          marginLeft: 16
        }}
      >
        {aiLoading ? 'AI 分析中...' : '🤖 AI 优化建议'}
      </button>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <span>🔴 {errors.length} 高危</span>
        <span>⚠️ {warnings.length} 警告</span>
        <span>ℹ️ {infos.length} 提示</span>
      </div>
      {/* {errors.length > 0 && (
        <div style={{ background: '#FEF2F2', padding: 12, marginBottom: 12, borderRadius: 6 }}>
          <h3 style={{ color: '#DC2626' }}>🔴 高危问题</h3>
          {errors.map((item, i) => (
            <div key={i} style={{ color: '#DC2626' }}>
              【{item.plugin}】{item.message}
            </div>
          ))}
        </div>
      )}
      {results.map((item, i) => {
        const color =
          item.level === 'error' ? '#DC2626' : item.level === 'warning' ? '#D97706' : '#6B7280'
        return (
          <div
            key={i}
            style={{
              color,
              marginBottom: 4,
              padding: 4,
              borderLeft: `3px solid ${color}`,
              paddingLeft: 8
            }}
          >
            【{item.plugin}】{item.message}
          </div>
        )
      })} */}
      {aiAdvice && (
        <div
          style={{
            marginTop: 16,
            background: '#F5F3FF',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #DDD6FE'
          }}
        >
          <h3 style={{ color: '#7C3AED', marginTop: 0 }}>🤖 AI 优化建议</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#333' }}>{aiAdvice}</div>
        </div>
      )}
    </div>
  )
}

export default App
