function MobileSidebar({ active = 'bank', onSelect, planId, branchLimit, branchUser, isOpen, onClose }) {
  const MobileNavItem = ({ id, label, icon = '📋', locked = false, activeId, onClick, description }) => (
    <a
      className={`mobile-nav-item ${activeId === id ? 'active' : ''} ${locked ? 'locked' : ''}`}
      href={"#" + id}
      onClick={(e) => { 
        e.preventDefault(); 
        if (locked) return; 
        onClick?.(id); 
        onClose?.(); // Close sidebar after navigation
        try { location.hash = '#' + id; } catch {} 
      }}
    >
      <div className="mobile-nav-item-icon">
        <span className="mobile-icon">{icon}</span>
        {locked && <span className="mobile-lock">🔒</span>}
      </div>
      <div className="mobile-nav-item-content">
        <span className="mobile-nav-item-label">{label}</span>
        {description && <span className="mobile-nav-item-desc">{description}</span>}
      </div>
      <div className="mobile-nav-item-arrow">
        <span>›</span>
      </div>
    </a>
  );

  const canUseBranch = planId === 'sales-gold' || planId === 'sales-premium';
  const isBranch = !!branchUser;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`mobile-sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside className={`mobile-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <MobileNav />
          <button 
            className="mobile-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span>✕</span>
          </button>
        </div>
        
        <nav className="mobile-nav">
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">
              {isBranch ? 'Branch Operations' : 'Business Management'}
            </div>
            
            {isBranch ? (
              // Branch users see a minimal branch nav
              <>
                <MobileNavItem 
                  id="bank" 
                  label="Payment Methods" 
                  icon="💳" 
                  description="Manage payment options"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="bank-history" 
                  label="Payment History" 
                  icon="📊" 
                  description="View transaction history"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="instock" 
                  label="Inventory" 
                  icon="📦" 
                  description="Track stock levels"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="product-sales" 
                  label="Point of Sale" 
                  icon="🛒" 
                  description="Process customer sales"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="seconds-sales" 
                  label="Quick Sales" 
                  icon="⚡" 
                  description="Fast checkout process"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="sales-track" 
                  label="Sales Analytics" 
                  icon="📈" 
                  description="Monitor performance"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="branch-expense" 
                  label="Expenses" 
                  icon="💸" 
                  description="Record branch costs"
                  activeId={active} 
                  onClick={onSelect} 
                />
              </>
            ) : (
              // Admin / seller view
              <>
                <MobileNavItem 
                  id="bank" 
                  label="Payment Methods" 
                  icon="💳" 
                  description="Set up payment options"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="bank-history" 
                  label="Payment History" 
                  icon="📊" 
                  description="View all transactions"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="supplier" 
                  label="Suppliers" 
                  icon="🏢" 
                  description="Manage vendors"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem 
                  id="instock" 
                  label="Master Inventory" 
                  icon="📦" 
                  description="Central stock management"
                  activeId={active} 
                  onClick={onSelect} 
                />
                <MobileNavItem
                  id="branch"
                  label="Branch Management"
                  icon="🏪"
                  description={canUseBranch ? "Manage locations" : "Upgrade to unlock"}
                  locked={!canUseBranch}
                  activeId={active}
                  onClick={onSelect}
                />
                <MobileNavItem 
                  id="branch-supply" 
                  label="Branch Supply" 
                  icon="🚚" 
                  description={canUseBranch ? "Supply branches" : "Upgrade required"}
                  activeId={active} 
                  onClick={onSelect} 
                  locked={!canUseBranch} 
                />
                <MobileNavItem 
                  id="branch-supply-history" 
                  label="Supply History" 
                  icon="📋" 
                  description={canUseBranch ? "Track supplies" : "Upgrade required"}
                  activeId={active} 
                  onClick={onSelect} 
                  locked={!canUseBranch} 
                />
              </>
            )}
          </div>
          
          {!isBranch && (
            <div className="mobile-nav-section">
              <div className="mobile-nav-section-title">Communication & Marketing</div>
              <MobileNavItem 
                id="whatsapp-contact" 
                label="WhatsApp Contacts" 
                icon="💬" 
                description="Manage customer contacts"
                activeId={active} 
                onClick={onSelect} 
              />
              <MobileNavItem 
                id="offer" 
                label="Promotions" 
                icon="🎯" 
                description="Create special offers"
                activeId={active} 
                onClick={onSelect} 
              />
              <MobileNavItem 
                id="whatsapp-stock" 
                label="WhatsApp Inventory" 
                icon="📱" 
                description="WhatsApp-specific stock"
                activeId={active} 
                onClick={onSelect} 
              />
            </div>
          )}
          
          <div className="mobile-nav-footer">
            <div className="mobile-plan-info">
              <div className="mobile-plan-badge">
                <span className="mobile-plan-icon">⭐</span>
                <span className="mobile-plan-text">
                  {planId === 'sales-premium' ? 'Premium Plan' : 
                   planId === 'sales-gold' ? 'Gold Plan' : 'Basic Plan'}
                </span>
              </div>
              {!isBranch && (
                <div className="mobile-branch-limit">
                  <span className="mobile-limit-text">
                    Branches: {branchLimit === 0 ? '0' : branchLimit || 'Unlimited'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

// Register globally for the in-browser JSX loader
window.MobileSidebar = MobileSidebar;
