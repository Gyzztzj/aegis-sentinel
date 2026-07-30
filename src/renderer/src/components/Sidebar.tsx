import React from 'react'

type TPage = 'scan' | 'history' | 'config'

interface SidebarProps {
  currentPage: TPage
  onPageChange: (page: TPage) => void
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps): React.ReactNode {
  const navItems = [
    { page: 'scan' as TPage, icon: '🔍', label: '检测' },
    { page: 'history' as TPage, icon: '📋', label: '历史记录' },
    { page: 'config' as TPage, icon: '⚙️', label: '配置' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Aegis</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onPageChange(item.page)}
            className={`sidebar-nav-item ${currentPage === item.page ? 'active' : ''}`}
          >
            <span className="sidebar-nav-item-icon">{item.icon}</span>
            <span className="sidebar-nav-item-text">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
