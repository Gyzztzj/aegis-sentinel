import { useEffect, useState } from 'react'
import { loadConfig, IAppConfig } from './utils/config-store'
import { IScanResult, IHistoryRecord } from './types'
import { Sidebar } from './components/Sidebar'
import { ScanPage } from './components/ScanPage'
import { HistoryPage } from './components/HistoryPage'
import ConfigPage from './components/ConfigPage'

type TPage = 'scan' | 'history' | 'config'

function App(): React.ReactNode {
  const [projectPath, setProjectPath] = useState<string>('')
  const [results, setResults] = useState<IScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [config, setConfig] = useState<IAppConfig | null>(null)
  const [page, setPage] = useState<TPage>('scan')

  useEffect(() => {
    loadConfig().then(setConfig).catch(console.error)
  }, [])

  const handleLoadHistory = (record: IHistoryRecord): void => {
    setResults(record.results)
    setAiAdvice(record.aiAdvice || '')
    setProjectPath(record.projectPath)
    setPage('scan')
  }

  const pageTitles: Record<TPage, { title: string; subtitle: string }> = {
    scan: { title: '项目检测', subtitle: 'Aegis Sentinel - 面向前端工程化的本地智能巡检工具' },
    history: { title: '历史记录', subtitle: '查看过往检测记录与统计信息' },
    config: { title: '系统配置', subtitle: '管理检测插件与AI大模型设置' }
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={page} onPageChange={setPage} />
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1 className="content-title">{pageTitles[page].title}</h1>
            <p className="content-subtitle">{pageTitles[page].subtitle}</p>
          </div>
        </header>
        {page === 'scan' ? (
          <ScanPage
            projectPath={projectPath}
            setProjectPath={setProjectPath}
            results={results}
            setResults={setResults}
            scanning={scanning}
            setScanning={setScanning}
            aiAdvice={aiAdvice}
            setAiAdvice={setAiAdvice}
            aiLoading={aiLoading}
            setAiLoading={setAiLoading}
            config={config}
          />
        ) : page === 'history' ? (
          <HistoryPage onLoadHistory={handleLoadHistory} />
        ) : (
          <div className="content-body">
            <ConfigPage />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
