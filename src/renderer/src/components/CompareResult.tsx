import React, { useState, useMemo } from 'react'
import { IDiffItem } from '../utils/diff'
import { Card } from './Card'
import { Button } from './Button'

interface CompareResultProps {
  diffResults: IDiffItem[]
  onClose: () => void
}

type FilterStatus = 'added' | 'removed' | 'level-changed' | 'unchanged'

const statusConfig = {
  added: {
    color: 'var(--color-error-600)',
    bg: 'var(--color-error-50)',
    borderColor: 'var(--color-error-500)',
    icon: '🆕',
    label: '新增',
    badgeClass: 'badge-error',
    cardBorder: 'var(--color-error-500)',
    cardActiveBg: 'var(--color-error-50)',
    countLabel: '新增问题'
  },
  removed: {
    color: 'var(--color-success-600)',
    bg: 'var(--color-success-50)',
    borderColor: 'var(--color-success-500)',
    icon: '✅',
    label: '已修复',
    badgeClass: 'badge-success',
    cardBorder: 'var(--color-success-500)',
    cardActiveBg: 'var(--color-success-50)',
    countLabel: '已修复'
  },
  'level-changed': {
    color: 'var(--color-warning-600)',
    bg: 'var(--color-warning-50)',
    borderColor: 'var(--color-warning-500)',
    icon: '🔄',
    label: '等级变化',
    badgeClass: 'badge-warning',
    cardBorder: 'var(--color-warning-500)',
    cardActiveBg: 'var(--color-warning-50)',
    countLabel: '等级变化'
  },
  unchanged: {
    color: 'var(--color-neutral-500)',
    bg: 'var(--color-neutral-50)',
    borderColor: 'var(--color-neutral-300)',
    icon: '➖',
    label: '未变化',
    badgeClass: '',
    cardBorder: 'var(--color-neutral-400)',
    cardActiveBg: 'var(--color-neutral-100)',
    countLabel: '未变化'
  }
}

export function CompareResult({ diffResults, onClose }: CompareResultProps): React.ReactNode {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('added')

  const counts = useMemo(
    () => ({
      added: diffResults.filter((r) => r.status === 'added').length,
      removed: diffResults.filter((r) => r.status === 'removed').length,
      'level-changed': diffResults.filter((r) => r.status === 'level-changed').length,
      unchanged: diffResults.filter((r) => r.status === 'unchanged').length
    }),
    [diffResults]
  )

  const totalCount = diffResults.length

  const filteredResults = useMemo(() => {
    return diffResults.filter((r) => r.status === activeFilter)
  }, [diffResults, activeFilter])

  const activeConfig = statusConfig[activeFilter]

  const getLevelLabel = (level: string): string => {
    const levelMap: Record<string, string> = {
      error: '高危',
      warning: '警告',
      info: '提示'
    }
    return levelMap[level] || level
  }

  const handleCardClick = (status: FilterStatus): void => {
    setActiveFilter(status)
  }

  return (
    <div className="compare-result-wrapper">
      {/* 固定区：标题 + 统计卡片 */}
      <div className="compare-fixed-zone">
        <Card
          className="compare-header-card"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊 历史报告对比</span>
              <span className="badge badge-info">共 {totalCount} 项</span>
            </div>
          }
          headerRight={
            <Button onClick={onClose} variant="secondary" size="sm">
              关闭对比
            </Button>
          }
        >
          <div className="compare-stats-overview">
            {(['added', 'removed', 'level-changed', 'unchanged'] as FilterStatus[]).map(
              (status) => {
                const config = statusConfig[status]
                const count = counts[status]
                const isActive = activeFilter === status
                return (
                  <div
                    key={status}
                    className={`compare-stat-card clickable ${isActive ? 'active' : ''}`}
                    style={{
                      borderLeftColor: config.cardBorder,
                      background: isActive ? config.cardActiveBg : undefined,
                      borderColor: isActive ? config.cardBorder : undefined,
                      borderWidth: isActive ? '2px' : undefined,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardClick(status)}
                  >
                    <div className="compare-stat-icon">{config.icon}</div>
                    <div className="compare-stat-content">
                      <div className="compare-stat-value" style={{ color: config.color }}>
                        {count}
                      </div>
                      <div className="compare-stat-label">{config.countLabel}</div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </Card>
      </div>

      {/* 可滚动区：结果列表 */}
      <div className="compare-scroll-zone">
        {filteredResults.length > 0 ? (
          <div className="compare-results-scroll">
            {filteredResults.map((item, index) => {
              const config = statusConfig[item.status]
              return (
                <div
                  key={index}
                  className="compare-result-item"
                  style={{
                    background: config.bg,
                    borderLeftColor: config.borderColor
                  }}
                >
                  <div className="compare-result-header">
                    <span className="compare-result-icon">{config.icon}</span>
                    <span
                      className={`badge ${config.badgeClass}`}
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                      {config.label}
                    </span>
                    {item.status === 'level-changed' && item.oldLevel && (
                      <span className="compare-level-change">
                        <span
                          className="badge"
                          style={{
                            background: 'var(--color-neutral-100)',
                            color: 'var(--color-neutral-500)'
                          }}
                        >
                          {getLevelLabel(item.oldLevel)}
                        </span>
                        <span className="compare-arrow">→</span>
                        <span
                          className={`badge ${
                            item.level === 'error'
                              ? 'badge-error'
                              : item.level === 'warning'
                                ? 'badge-warning'
                                : 'badge-info'
                          }`}
                        >
                          {getLevelLabel(item.level)}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="compare-result-body">
                    <div className="compare-result-plugin">
                      <span
                        className="badge badge-info"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      >
                        {item.plugin}
                      </span>
                    </div>
                    <div className="compare-result-message">{item.message}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="compare-no-changes">
            <div className="compare-no-changes-icon">
              {activeFilter === 'unchanged' ? '📋' : '✨'}
            </div>
            <div className="compare-no-changes-text">
              {activeFilter === 'unchanged' ? '没有未变化的项目' : `暂无${activeConfig.countLabel}`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
