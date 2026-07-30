import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
  style?: React.CSSProperties
}

export function Card({
  children,
  title,
  className = '',
  headerRight,
  style
}: CardProps): React.ReactNode {
  return (
    <div className={`card ${className}`} style={style}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          {headerRight}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
