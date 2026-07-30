import React from 'react'
import { IScanResult } from '../types'

interface ResultItemProps {
  result: IScanResult
}

export function ResultItem({ result }: ResultItemProps): React.ReactNode {
  const icons = {
    error: '🛑',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`result-item ${result.level}`}>
      <span className="result-icon">{icons[result.level]}</span>
      <div className="result-content">
        <span className="result-plugin">{result.plugin}</span>
        <p className="result-message">{result.message}</p>
      </div>
    </div>
  )
}
