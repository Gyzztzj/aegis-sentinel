import React, { useState, useEffect, useMemo } from 'react'
import { IHistoryRecord } from '../types'
import { getAllHistory, getHistoryById, deleteHistory } from '../utils/db'
import { compareReports, IDiffItem } from '../utils/diff'
import { Card } from './Card'
import { Button } from './Button'
import { HistoryItem } from './HistoryItem'
import { CompareResult } from './CompareResult'
import { EmptyState } from './EmptyState'
import { Loading } from './Loading'
import { Tabs } from './Tabs'

interface HistoryPageProps {
  onLoadHistory: (record: IHistoryRecord) => void
}

export function HistoryPage({ onLoadHistory }: HistoryPageProps): React.ReactNode {
  const [state, setState] = useState({
    loading: true,
    historyList: [] as IHistoryRecord[]
  })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<'history' | 'compare'>('history')

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [diffResults, setDiffResults] = useState<IDiffItem[]>([])
  const [showCompareResult, setShowCompareResult] = useState(false)
  const [comparing, setComparing] = useState(false)

  const changedCount = useMemo(() => {
    if (!diffResults.length) return 0
    return diffResults.filter((r) => r.status !== 'unchanged').length
  }, [diffResults])

  useEffect(() => {
    let unMounted = false

    const loadHistory = async (): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const list = await getAllHistory()
        if (!unMounted) {
          setState({ loading: false, historyList: list })
        }
      } catch (err) {
        console.error(err)
        if (!unMounted) {
          setState((prev) => ({ ...prev, loading: false }))
        }
      }
    }
    loadHistory()

    return () => {
      unMounted = true
    }
  }, [])

  const handleLoadHistory = async (record: IHistoryRecord): Promise<void> => {
    const detail = await getHistoryById(record.id)
    if (detail) {
      onLoadHistory(detail)
    }
  }

  const handleDeleteHistory = async (id: number): Promise<void> => {
    setDeletingId(id)
    await deleteHistory(id)
    setState((prev) => ({ ...prev, historyList: prev.historyList.filter((r) => r.id !== id) }))
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
    setDeletingId(null)
  }

  const handleClearAll = async (): Promise<void> => {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return
    for (const record of state.historyList) {
      await deleteHistory(record.id)
    }
    setState({ loading: false, historyList: [] })
    setSelectedIds([])
    setSelectMode(false)
    setShowCompareResult(false)
  }

  const handleToggleSelectMode = (): void => {
    setSelectMode(!selectMode)
    setSelectedIds([])
    setShowCompareResult(false)
    setDiffResults([])
  }

  const handleToggleSelect = (id: number): void => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id)
      } else {
        if (prev.length >= 2) {
          return prev
        }
        return [...prev, id]
      }
    })
  }

  const parseCreatedAt = (value: string): number => {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? 0 : time
  }

  const handleCompare = async (): Promise<void> => {
    if (selectedIds.length !== 2) return

    setComparing(true)
    try {
      const [firstId, secondId] = selectedIds
      const [record1, record2] = await Promise.all([
        getHistoryById(firstId),
        getHistoryById(secondId)
      ])

      if (record1 && record2) {
        const [oldRecord, newRecord] =
          parseCreatedAt(record1.createdAt) <= parseCreatedAt(record2.createdAt)
            ? [record1, record2]
            : [record2, record1]

        const results = compareReports(oldRecord, newRecord)
        setDiffResults(results)
        setShowCompareResult(true)
        setActiveTab('compare')
      }
    } catch (err) {
      console.error('对比失败:', err)
      alert('对比失败，请重试')
    } finally {
      setComparing(false)
    }
  }

  const handleCloseCompare = (): void => {
    setShowCompareResult(false)
    setDiffResults([])
    setSelectedIds([])
    setSelectMode(false)
    setActiveTab('history')
  }

  const handleExitSelectMode = (): void => {
    setSelectMode(false)
    setSelectedIds([])
    setShowCompareResult(false)
    setDiffResults([])
  }

  return (
    <div className="page-scroll-container">
      <Tabs
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'history' | 'compare')}
        tabs={[
          {
            id: 'history',
            label: '历史记录',
            icon: '📋',
            badge: state.historyList.length || undefined,
            children: (
              <div className="history-tab-content">
                {/* 固定区：统计概览 */}
                {state.historyList.length > 0 && (
                  <div className="history-fixed-zone">
                    <Card title="📊 统计概览">
                      <div className="stats-bar" style={{ marginBottom: 0 }}>
                        <div className="stat-item">
                          <span className="stat-icon">📝</span>
                          <div>
                            <div className="stat-label">检测次数</div>
                            <div className="stat-value">{state.historyList.length}</div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">🛑</span>
                          <div>
                            <div className="stat-label">累计高危</div>
                            <div className="stat-value" style={{ color: '#ef4444' }}>
                              {state.historyList.reduce(
                                (sum, r) =>
                                  sum + r.results.filter((rr) => rr.level === 'error').length,
                                0
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">⚠️</span>
                          <div>
                            <div className="stat-label">累计警告</div>
                            <div className="stat-value" style={{ color: '#f59e0b' }}>
                              {state.historyList.reduce(
                                (sum, r) =>
                                  sum + r.results.filter((rr) => rr.level === 'warning').length,
                                0
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">ℹ️</span>
                          <div>
                            <div className="stat-label">累计提示</div>
                            <div className="stat-value" style={{ color: '#0ea5e9' }}>
                              {state.historyList.reduce(
                                (sum, r) =>
                                  sum + r.results.filter((rr) => rr.level === 'info').length,
                                0
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 固定区：历史记录卡片 header */}
                <div className="history-card-zone">
                  <Card
                    className="history-list-card"
                    title={
                      selectMode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📋 选择记录进行对比</span>
                          <span className="badge badge-info">已选择 {selectedIds.length}/2</span>
                        </div>
                      ) : (
                        '📋 检测历史记录'
                      )
                    }
                    headerRight={
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {selectMode ? (
                          <>
                            {selectedIds.length === 2 && (
                              <Button
                                onClick={handleCompare}
                                variant="accent"
                                size="sm"
                                disabled={comparing}
                              >
                                {comparing ? '对比中...' : '📊 对比选中'}
                              </Button>
                            )}
                            <Button onClick={handleExitSelectMode} variant="secondary" size="sm">
                              取消
                            </Button>
                          </>
                        ) : (
                          state.historyList.length > 0 && (
                            <>
                              <Button onClick={handleToggleSelectMode} variant="accent" size="sm">
                                🔍 选择对比
                              </Button>
                              <Button onClick={handleClearAll} variant="secondary" size="sm">
                                🗑️ 清空全部
                              </Button>
                            </>
                          )
                        )}
                      </div>
                    }
                  >
                    {/* 可滚动区：历史记录列表 */}
                    <div className="history-records-scroll">
                      {state.loading ? (
                        <Loading text="加载历史记录中..." />
                      ) : state.historyList.length === 0 ? (
                        <EmptyState
                          icon="📭"
                          title="暂无历史记录"
                          description="完成项目检测后，记录将保存在这里"
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {state.historyList.map((record, index) => (
                            <div
                              key={record.id}
                              className="animate-fade-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div style={{ position: 'relative' }}>
                                <HistoryItem
                                  record={record}
                                  onClick={() => handleLoadHistory(record)}
                                  selectMode={selectMode}
                                  isSelected={selectedIds.includes(record.id)}
                                  onToggleSelect={() => handleToggleSelect(record.id)}
                                  disabled={
                                    !selectedIds.includes(record.id) && selectedIds.length >= 2
                                  }
                                />
                                {!selectMode && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteHistory(record.id)
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="history-delete-btn"
                                  >
                                    {deletingId === record.id ? (
                                      <span
                                        className="animate-spin"
                                        style={{
                                          display: 'inline-block',
                                          width: '14px',
                                          height: '14px',
                                          border: '1px solid currentColor',
                                          borderTopColor: 'transparent',
                                          borderRadius: '50%'
                                        }}
                                      />
                                    ) : (
                                      '🗑️'
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )
          },
          {
            id: 'compare',
            label: '对比结果',
            icon: '📊',
            badge: changedCount || undefined,
            children:
              showCompareResult && diffResults.length > 0 ? (
                <CompareResult diffResults={diffResults} onClose={handleCloseCompare} />
              ) : (
                <div className="history-compare-empty">
                  <EmptyState
                    icon="🔍"
                    title="暂无对比结果"
                    description="在「历史记录」Tab 中选择两条记录进行对比"
                  />
                </div>
              )
          }
        ]}
      />
    </div>
  )
}
