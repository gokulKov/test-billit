function HeaderBar({ title, subtitle, user, onLogout }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1>{title}</h1>
        {subtitle ? <div className="subtitle">{subtitle}</div> : null}
      </div>
      <div className="header-right">
        {user && (
          <div className="user-menu">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                {user.name || user.email || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {user.role || 'Admin'}
              </div>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                title="Logout"
              >
                🚪
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Register globally for the in-browser JSX loader
window.HeaderBar = HeaderBar;
