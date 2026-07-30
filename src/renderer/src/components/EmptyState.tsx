import React from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps): React.ReactNode {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-description">{description}</div>}
    </div>
  )
}
