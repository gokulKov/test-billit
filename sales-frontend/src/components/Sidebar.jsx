function Sidebar({ active = 'bank', onSelect, planId, branchLimit, branchUser }) {
  const Item = ({ id, label, icon = '📋', locked = false, activeId, onClick }) => (
    <a
      className={'nav-item ' + (activeId === id ? 'active' : '')}
      href={"#" + id}
      onClick={(e) => { e.preventDefault(); if (locked) return; onClick?.(id); try { location.hash = '#' + id; } catch {} }}
    >
      <span className="icon">{icon}</span>
      <span>{label}</span>
      {locked ? <span className="lock">🔒</span> : null}
    </a>
  );

  const canUseBranch = planId === 'sales-gold' || planId === 'sales-premium';
  const isBranch = !!branchUser;

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>SalesPro</h1>
        <p>Mobile Sales Management</p>
      </div>
      <nav className="nav">
        {isBranch ? (
          // Branch users see a minimal branch nav
          <>
            <Item id="bank" label="Payment Methods" icon={"💳"} activeId={active} onClick={onSelect} />
            <Item id="bank-history" label="Payment History" icon={"📊"} activeId={active} onClick={onSelect} />
            <Item id="instock" label="Inventory" icon={"📦"} activeId={active} onClick={onSelect} />
            <Item id="product-sales" label="Point of Sale" icon={"🛒"} activeId={active} onClick={onSelect} />
            <Item id="seconds-sales" label="Quick Sales" icon={"⚡"} activeId={active} onClick={onSelect} />
            <Item id="sales-track" label="Sales Analytics" icon={"📈"} activeId={active} onClick={onSelect} />
            <Item id="branch-expense" label="Expenses" icon={"💸"} activeId={active} onClick={onSelect} />
          </>
        ) : (
          // Admin / seller view
          <>
            <Item id="bank" label="Payment Methods" icon={"💳"} activeId={active} onClick={onSelect} />
            <Item id="bank-history" label="Payment History" icon={"📊"} activeId={active} onClick={onSelect} />
            <Item id="supplier" label="Suppliers" icon={"🏢"} activeId={active} onClick={onSelect} />
            <Item id="instock" label="Master Inventory" icon={"📦"} activeId={active} onClick={onSelect} />
            <Item
              id="branch"
              label={canUseBranch ? `Branch Management` : 'Branch Management'}
              icon={"🏪"}
              locked={!canUseBranch}
              activeId={active}
              onClick={onSelect}
            />
            <Item id="branch-supply" label="Branch Supply" icon={"🚚"} activeId={active} onClick={onSelect} locked={!canUseBranch} />
            <Item id="branch-supply-history" label="Supply History" icon={"📋"} activeId={active} onClick={onSelect} locked={!canUseBranch} />
            <Item id="whatsapp-contact" label="WhatsApp Contacts" icon={"💬"} activeId={active} onClick={onSelect} />
            <Item id="offer" label="Promotions" icon={"🎯"} activeId={active} onClick={onSelect} />
            <Item id="whatsapp-stock" label="WhatsApp Inventory" icon={"📱"} activeId={active} onClick={onSelect} />
          </>
        )}
      </nav>
    </aside>
  );
}

// Register globally for the in-browser JSX loader
window.Sidebar = Sidebar;
