import React, { useState, useEffect } from 'react'
import { IHistoryRecord } from '../types'
import { getAllHistory, getHistoryById, deleteHistory } from '../utils/db'
import { Card } from './Card'
import { Button } from './Button'
import { HistoryItem } from './HistoryItem'
import { EmptyState } from './EmptyState'
import { Loading } from './Loading'

interface HistoryPageProps {
  onLoadHistory: (record: IHistoryRecord) => void
}

export function HistoryPage({ onLoadHistory }: HistoryPageProps): React.ReactNode {
  const [historyList, setHistoryList] = useState<IHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async (): Promise<void> => {
    setLoading(true)
    const list = await getAllHistory()
    setHistoryList(list)
    setLoading(false)
  }

  const handleLoadHistory = async (record: IHistoryRecord): Promise<void> => {
    const detail = await getHistoryById(record.id)
    if (detail) {
      onLoadHistory(detail)
    }
  }

  const handleDeleteHistory = async (id: number): Promise<void> => {
    setDeletingId(id)
    await deleteHistory(id)
    setHistoryList((prev) => prev.filter((r) => r.id !== id))
    setDeletingId(null)
  }

  const handleClearAll = async (): Promise<void> => {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return
    for (const record of historyList) {
      await deleteHistory(record.id)
    }
    setHistoryList([])
  }

  return (
    <div className="content-body">
      <div className="section">
        <Card
          title="📋 检测历史记录"
          headerRight={
            historyList.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="secondary"
                size="sm"
              >
                🗑️ 清空全部
              </Button>
            )
          }
        >
          {loading ? (
            <Loading text="加载历史记录中..." />
          ) : historyList.length === 0 ? (
            <EmptyState
              icon="📭"
              title="暂无历史记录"
              description="完成项目检测后，记录将保存在这里"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {historyList.map((record, index) => (
                <div
                  key={record.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div style={{ position: 'relative' }}>
                    <HistoryItem record={record} onClick={() => handleLoadHistory(record)} />
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteHistory(record.id)
                      }}
                      variant="secondary"
                      size="sm"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        opacity: 0.5,
                        transition: 'opacity 200ms'
                      }}
                    >
                      {deletingId === record.id ? (
                        <span className="animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '1px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      ) : (
                        '🗑️'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 统计信息 */}
      {historyList.length > 0 && (
        <div className="section">
          <Card title="📊 统计概览">
            <div className="stats-bar" style={{ marginBottom: 0 }}>
              <div className="stat-item">
                <span className="stat-icon">📝</span>
                <div>
                  <div className="stat-label">检测次数</div>
                  <div className="stat-value">{historyList.length}</div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🛑</span>
                <div>
                  <div className="stat-label">累计高危</div>
                  <div className="stat-value" style={{ color: '#ef4444' }}>
                    {historyList.reduce((sum, r) => sum + r.results.filter((rr) => rr.level === 'error').length, 0)}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⚠️</span>
                <div>
                  <div className="stat-label">累计警告</div>
                  <div className="stat-value" style={{ color: '#f59e0b' }}>
                    {historyList.reduce((sum, r) => sum + r.results.filter((rr) => rr.level === 'warning').length, 0)}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">ℹ️</span>
                <div>
                  <div className="stat-label">累计提示</div>
                  <div className="stat-value" style={{ color: '#0ea5e9' }}>
                    {historyList.reduce((sum, r) => sum + r.results.filter((rr) => rr.level === 'info').length, 0)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
