function BranchInStock({ salesUrl, token }) {
  const [entries, setEntries] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [supplierId, setSupplierId] = React.useState('');
  const [error, setError] = React.useState('');

  const loadSuppliers = async () => {
    try {
      const res = await fetch(salesUrl + '/api/suppliers', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load suppliers');
      setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
    } catch (e) { setError(e.message); }
  };

  const loadEntries = async (sid) => {
    try {
      setError('');
      const url = new URL(salesUrl + '/api/in-stock');
      if (sid) url.searchParams.set('supplier_id', sid);
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) { setError(e.message); }
  };

  React.useEffect(() => { loadSuppliers(); loadEntries(); }, [token]);

  const onSupplierChange = (e) => { const id = e.target.value; setSupplierId(id); loadEntries(id); };

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="stat-card">
          <div className="stat-label">Selected Supplier Total Amount</div>
          <div className="stat-value">{currency(entries.reduce((s,e)=>s + (Number(e.supplierAmount)||0),0))}</div>
        </div>
      </div>

      <div className="card mt-3 table-card">
        <div className="table-title">In Stock Entries</div>
        <div style={{padding:'12px'}}>
          <label style={{display:'block', marginBottom:6}}>Filter by Supplier</label>
          <select value={supplierId} onChange={onSupplierChange}>
            <option value="">All suppliers</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName || s.agencyName || s._id}</option>)}
          </select>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state" style={{padding:24}}>
            <div className="empty-icon">📦</div>
            <div className="empty-title">No Entries</div>
            <div className="empty-sub">No in-stock entries found for this branch.</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="pretty-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Qty</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Product Validity</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {entries.flatMap(e => (Array.isArray(e.items) ? e.items : []).map((it, idx) => (
                  <tr key={`${e._id}-${idx}`}>
                    <td><span className="cell-strong">{e.supplier_id?.supplierName || '-'}</span></td>
                    <td>{it.productName || '-'}</td>
                    <td>{it.brand || '-'}</td>
                    <td>{it.model || '-'}</td>
                    <td>{it.quantity ?? '-'}</td>
                    <td>{it.costPrice ?? '-'}</td>
                    <td>{it.sellingPrice ?? '-'}</td>
                    <td>{it.validity ? new Date(it.validity).toLocaleDateString() : '-'}</td>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))) }
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
