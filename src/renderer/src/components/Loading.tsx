import React from 'react'

interface LoadingProps {
  text?: string
}

export function Loading({ text = '加载中...' }: LoadingProps): React.ReactNode {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <div className="loading-text">{text}</div>
    </div>
  )
}
