function MobileHeader({ title, subtitle, user, onLogout, onMenuToggle, isMenuOpen }) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        <button 
          className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <div className="mobile-header-content">
          <h1 className="mobile-title">{title}</h1>
          {subtitle && <div className="mobile-subtitle">{subtitle}</div>}
        </div>
      </div>
      
      <div className="mobile-header-right">
        {user && (
          <div className="mobile-user-menu">
            <div className="mobile-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="mobile-logout-btn"
                title="Logout"
                aria-label="Logout"
              >
                <span>🚪</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Register globally for the in-browser JSX loader
window.MobileHeader = MobileHeader;
