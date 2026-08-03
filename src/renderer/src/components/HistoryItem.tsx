import React from 'react'
import { IHistoryRecord } from '../types'

interface HistoryItemProps {
  record: IHistoryRecord
  onClick: () => void
  selectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
  disabled?: boolean
}

export function HistoryItem({
  record,
  onClick,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  disabled = false
}: HistoryItemProps): React.ReactNode {
  const errors = record.results.filter((r) => r.level === 'error').length
  const warnings = record.results.filter((r) => r.level === 'warning').length
  const infos = record.results.filter((r) => r.level === 'info').length

  const handleClick = (): void => {
    if (selectMode) {
      onToggleSelect?.()
    } else {
      onClick()
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    e.stopPropagation()
    onToggleSelect?.()
  }

  const formatCreatedAt = (value: string): string => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '未知时间'
    }
    return date.toLocaleString()
  }

  return (
    <div
      className={`history-item ${isSelected ? 'history-item-selected' : ''} ${disabled ? 'history-item-disabled' : ''}`}
      onClick={handleClick}
    >
      {selectMode && (
        <div
          style={{ display: 'none' }}
          className="history-item-checkbox"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            disabled={disabled}
            onChange={handleCheckboxChange}
            className="compare-checkbox"
          />
        </div>
      )}
      <div style={{ flex: 1, paddingRight: '40px' }}>
        <div className="history-item-header">
          <span className="history-project-name">📁 {record.projectName}</span>
          <span className="history-time">{formatCreatedAt(record.createdAt)}</span>
        </div>
        <div className="history-stats">
          <span className="history-stat">
            <span>🛑</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>
              {errors}
            </span>
          </span>
          <span className="history-stat">
            <span>⚠️</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>
              {warnings}
            </span>
          </span>
          <span className="history-stat">
            <span>ℹ️</span>
            <span className="stat-value" style={{ color: '#0ea5e9' }}>
              {infos}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
