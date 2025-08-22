function Sidebar({ active = 'bank', onSelect, planId, branchLimit, branchUser }) {
  const Item = ({ id, label, icon = '•', locked = false, activeId, onClick }) => (
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
      <div className="brand">Fixel</div>
      <nav className="nav">
        {isBranch ? (
          // Branch users see a minimal branch nav; first item is Create Bank per request
          <>
            <Item id="bank" label="Create Bank" icon={"🏦"} activeId={active} onClick={onSelect} />
            <Item id="bank-history" label="Bank History" icon={"📜"} activeId={active} onClick={onSelect} />
            <Item id="instock" label="In Stock" icon={"📦"} activeId={active} onClick={onSelect} />
            <Item id="product-sales" label="Product Sales" icon={"🛍️"} activeId={active} onClick={onSelect} />
            <Item id="sales-track" label="Sales Track" icon={"📊"} activeId={active} onClick={onSelect} />
            <Item id="branch-expense" label="New Expense" icon={"💸"} activeId={active} onClick={onSelect} />
          
          </>
        ) : (
          // Admin / seller view
          <>
            <Item id="bank" label="Create Bank" icon={"🏦"} activeId={active} onClick={onSelect} />
            <Item id="bank-history" label="Bank History" icon={"📜"} activeId={active} onClick={onSelect} />
            <Item id="supplier" label="Create Supplier" icon={"🛒"} activeId={active} onClick={onSelect} />
            <Item id="instock" label="In Stock" icon={"📦"} activeId={active} onClick={onSelect} />
            <Item
              id="branch"
              label={canUseBranch
                ? `Create Branch`
                : 'Create Branch'}
              icon={"🌿"}
              locked={!canUseBranch}
              activeId={active}
              onClick={onSelect}
            />
              <Item id="branch-supply" label="Branch Supply" icon={"🚚"} activeId={active} onClick={onSelect} locked={!canUseBranch} />
              <Item id="branch-supply-history" label="Branch Supply History" icon={"📋"} activeId={active} onClick={onSelect} locked={!canUseBranch} />
          </>
        )}
      </nav>
    </aside>
  );
}

// Register globally for the in-browser JSX loader
window.Sidebar = Sidebar;
