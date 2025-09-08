function BranchInStock({ salesUrl, token }) {
  const [entries, setEntries] = React.useState([]);
  const [error, setError] = React.useState('');
  // Add filter states
  const [productNoFilter, setProductNoFilter] = React.useState('');
  const [productNameFilter, setProductNameFilter] = React.useState('');
  const [brandFilter, setBrandFilter] = React.useState('');
  const [modelFilter, setModelFilter] = React.useState('');
  const [qtyFilter, setQtyFilter] = React.useState('');

  const loadEntries = async () => {
    try {
      setError('');
      const url = new URL(salesUrl + '/api/branch-stock');
      url.searchParams.set('only_branch', '1');
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setEntries(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) { setError(e.message); }
  };

  React.useEffect(() => { loadEntries(); }, [token]);
  React.useEffect(() => {
    const onUpdated = (e) => {
      // if branch-specific update then reload regardless; UI will decide filtering
      loadEntries();
    };
    window.addEventListener('branch-stock-updated', onUpdated);
    return () => window.removeEventListener('branch-stock-updated', onUpdated);
  }, [token]);

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  // Filtering logic
  const filteredEntries = React.useMemo(() => {
    return entries.filter(it => {
      const qtyVal = it.branchQty ?? it.qty ?? '';
      return (
        (!productNoFilter || (it.productNo || '').toLowerCase().includes(productNoFilter.toLowerCase())) &&
        (!productNameFilter || (it.productName || '').toLowerCase().includes(productNameFilter.toLowerCase())) &&
        (!brandFilter || (it.brand || '').toLowerCase().includes(brandFilter.toLowerCase())) &&
        (!modelFilter || (it.model || '').toLowerCase().includes(modelFilter.toLowerCase())) &&
        (!qtyFilter || String(qtyVal).includes(qtyFilter))
      );
    });
  }, [entries, productNoFilter, productNameFilter, brandFilter, modelFilter, qtyFilter]);

  return (
    <div>
      <div className="card mt-3 table-card">
        <div className="table-title">In Stock (Branch)</div>
        {/* Filter Section */}
        <div className="filter-section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input type="text" placeholder="Filter by Product No" value={productNoFilter} onChange={e => setProductNoFilter(e.target.value)} style={{ padding: '8px', width: '160px' }} />
          <input type="text" placeholder="Filter by Product Name" value={productNameFilter} onChange={e => setProductNameFilter(e.target.value)} style={{ padding: '8px', width: '160px' }} />
          <input type="text" placeholder="Filter by Brand" value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ padding: '8px', width: '120px' }} />
          <input type="text" placeholder="Filter by Model" value={modelFilter} onChange={e => setModelFilter(e.target.value)} style={{ padding: '8px', width: '120px' }} />
          <input type="text" placeholder="Filter by Qty" value={qtyFilter} onChange={e => setQtyFilter(e.target.value)} style={{ padding: '8px', width: '80px' }} />
        </div>
        {filteredEntries.length === 0 ? (
          <div className="empty-state" style={{padding:24}}>
            <div className="empty-icon">📦</div>
            <div className="empty-title">No Entries</div>
            <div className="empty-sub">No in-stock entries found for this branch.</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product No</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Qty </th>
                  <th>Selling Price</th>
                  <th>Validity</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((it, idx) => (
                  <tr key={it._id || idx}>
                    <td>{it.productNo || '-'}</td>
                    <td>{it.productName || '-'}</td>
                    <td>{it.brand || '-'}</td>
                    <td>{it.model || '-'}</td>
                    <td>{it.branchQty ?? (it.qty ?? '-')}</td>
                    <td>{it.sellingPrice != null ? it.sellingPrice : '-'}</td>
                    <td>{it.validity ? new Date(it.validity).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error ? <div className="mt-2 text-danger" style={{padding:12}}>{error}</div> : null}
      </div>
    </div>
  );
}

// Register globally for in-browser JSX loader
window.BranchInStock = BranchInStock;
