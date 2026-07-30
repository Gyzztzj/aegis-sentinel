import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'error' | 'warning' | 'info' | 'success'
}

export function Badge({ children, variant = 'info' }: BadgeProps): React.ReactNode {
  const variantClasses = {
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    success: 'badge-success'
  }

  return <span className={`badge ${variantClasses[variant]}`}>{children}</span>
}
