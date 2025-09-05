function MobileQuickActions({ branchUser, onActionSelect }) {
  const quickActions = branchUser ? [
    { id: 'product-sales', label: 'New Sale', icon: '🛒', color: 'var(--success)' },
    { id: 'seconds-sales', label: 'Quick Sale', icon: '⚡', color: 'var(--warning)' },
    { id: 'instock', label: 'Check Stock', icon: '📦', color: 'var(--info)' },
    { id: 'branch-expense', label: 'Add Expense', icon: '💸', color: 'var(--danger)' }
  ] : [
    { id: 'branch', label: 'Branches', icon: '🏪', color: 'var(--primary)' },
    { id: 'instock', label: 'Inventory', icon: '📦', color: 'var(--info)' },
    { id: 'supplier', label: 'Suppliers', icon: '🏢', color: 'var(--secondary)' },
    { id: 'sales-track', label: 'Analytics', icon: '📈', color: 'var(--success)' }
  ];

  return (
    <div className="mobile-quick-actions">
      <div className="mobile-quick-actions-header">
        <h3 className="mobile-quick-actions-title">Quick Actions</h3>
        <p className="mobile-quick-actions-subtitle">Tap to get started</p>
      </div>
      <div className="mobile-quick-actions-grid">
        {quickActions.map(action => (
          <button
            key={action.id}
            className="mobile-quick-action"
            onClick={() => onActionSelect?.(action.id)}
            style={{ '--action-color': action.color }}
          >
            <div className="mobile-quick-action-icon">{action.icon}</div>
            <span className="mobile-quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Register globally for the in-browser JSX loader
window.MobileQuickActions = MobileQuickActions;
