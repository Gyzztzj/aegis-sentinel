import React from 'react'
import { IHistoryRecord } from '../types'

interface HistoryItemProps {
  record: IHistoryRecord
  onClick: () => void
}

export function HistoryItem({ record, onClick }: HistoryItemProps): React.ReactNode {
  const errors = record.results.filter((r) => r.level === 'error').length
  const warnings = record.results.filter((r) => r.level === 'warning').length
  const infos = record.results.filter((r) => r.level === 'info').length

  return (
    <div className="history-item" onClick={onClick}>
      <div className="history-item-header">
        <span className="history-project-name">📁 {record.projectName}</span>
        <span className="history-time">{new Date(record.createdAt).toLocaleString()}</span>
      </div>
      <div className="history-stats">
        <span className="history-stat">
          <span>🛑</span>
          <span className="stat-value" style={{ color: '#ef4444' }}>{errors}</span>
        </span>
        <span className="history-stat">
          <span>⚠️</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>{warnings}</span>
        </span>
        <span className="history-stat">
          <span>ℹ️</span>
          <span className="stat-value" style={{ color: '#0ea5e9' }}>{infos}</span>
        </span>
      </div>
    </div>
  )
}
