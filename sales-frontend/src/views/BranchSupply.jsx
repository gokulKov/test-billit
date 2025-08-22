function BranchSupply({ salesUrl, token }) {
  const [branches, setBranches] = React.useState([]);
  const [selectedBranch, setSelectedBranch] = React.useState('');
  const [stock, setStock] = React.useState([]);
  const [selectedRows, setSelectedRows] = React.useState({});
  const [totalValue, setTotalValue] = React.useState(0);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loadBranches = async () => {
    try {
      const res = await fetch(salesUrl + '/api/branches', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load branches');
      setBranches(Array.isArray(data.branches) ? data.branches : []);
    } catch (e) { setError(e.message); }
  };

  const loadStock = async (branchId) => {
    try {
      setError('');
      const url = new URL(salesUrl + '/api/branch-stock');
      if (branchId) url.searchParams.set('branch_id', branchId);
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load branch stock');
      setStock(Array.isArray(data.rows) ? data.rows : []);
      setSelectedRows({});
      setTotalValue(0);
    } catch (e) { setError(e.message); }
  };

  React.useEffect(() => { loadBranches(); }, [token]);

  React.useEffect(() => { if (selectedBranch) loadStock(selectedBranch); }, [selectedBranch]);

  const onQtyChange = (productId, qty) => {
    const row = stock.find(s => (s.productId || s._id) === productId);
    const q = Number(qty) || 0;
  const pct = Number(selectedRows[productId]?.pct || 0);
  const cost = Number(row?.costPrice || 0);
  const sellingPrice = pct ? (cost * (1 + pct / 100)) : Number(row?.sellingPrice || 0);
  const value = sellingPrice * q;
  const next = { ...selectedRows, [productId]: { qty: q, value, productId, pct, sellingPrice } };
    setSelectedRows(next);
    const total = Object.values(next).reduce((s, it) => s + (Number(it.value) || 0), 0);
    setTotalValue(total);
  };

  const onPctChange = (productId, pctVal) => {
    const row = stock.find(s => (s.productId || s._id) === productId) || {};
    const pct = Number(pctVal) || 0;
    const q = Number(selectedRows[productId]?.qty || 0);
    const cost = Number(row?.costPrice || 0);
    const sellingPrice = cost * (1 + pct / 100);
    const value = sellingPrice * q;
    const next = { ...selectedRows, [productId]: { qty: q, value, productId, pct, sellingPrice } };
    setSelectedRows(next);
    const total = Object.values(next).reduce((s, it) => s + (Number(it.value) || 0), 0);
    setTotalValue(total);
  };

  const onSupply = async () => {
    try {
  setError('');
  if (!selectedBranch) return setError('Select a branch');
  setLoading(true);
      const items = Object.values(selectedRows).map(r => {
        const row = stock.find(s => (s.productId || s._id) === r.productId) || {};
        const sellingPrice = r.sellingPrice ?? row.sellingPrice ?? 0;
        return {
          productId: r.productId,
          productName: row.productName || row.name || '',
          brand: row.brand || '',
          model: row.model || '',
          validity: row.validity || null,
          qty: r.qty,
          sellingPrice: sellingPrice,
          costPrice: row.costPrice,
          pct: r.pct || 0
        };
      }).filter(i => i.qty > 0);
      if (items.length === 0) return setError('Select at least one product and enter qty');
      const res = await fetch(salesUrl + '/api/branch-supply', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ branch_id: selectedBranch, items })
      });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Supply failed');
  // Always reload branch stock after a successful supply to keep UI consistent
  // If the API returns updated rows, we'll still refresh from server to ensure canonical state
  await loadStock(selectedBranch);
      // notify other parts of the app that branch stock changed
      try {
        const ev = new CustomEvent('branch-stock-updated', { detail: { branchId: selectedBranch } });
        window.dispatchEvent(ev);
      } catch (__) {}

      setSelectedRows({}); setTotalValue(0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <label>Select Branch</label>
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            <option value="">-- select branch --</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontWeight:700}}>Total Supply Value</div>
          <div style={{fontSize:18}}>{currency(totalValue)}</div>
        </div>
      </div>

      <div className="card mt-3 table-card">
        <div className="table-title">Branch Stock</div>
        {stock.length === 0 ? (
          <div className="empty-state" style={{padding:24}}>
            <div className="empty-icon">📦</div>
            <div className="empty-title">No Products</div>
            <div className="empty-sub">Select a branch to view its stock (or central stock if implemented).</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="pretty-table">
              <thead>
                <tr>
                  <th>Product No</th>
                  <th></th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Qty</th>
                 
                  <th>Total Cost</th>
                  <th>Selling Price</th>
                  <th>Supply Qty</th>
                  <th>Value</th>
                  <th>Validity</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => {
                  const pid = s.productId || s._id;
                  const sel = selectedRows[pid] || { qty: 0, value: 0 };
                  return (
                    <tr key={pid}>
                      <td>{s.productNo || '-'}</td>
                      <td><input type="checkbox" checked={sel.qty>0} onChange={e => onQtyChange(pid, e.target.checked ? 1 : 0)} /></td>
                      <td>{s.productName || '-'}</td>
                      <td>{s.brand || '-'}</td>
                      <td>{s.model || '-'}</td>
                      <td>{(s.centralQty != null ? s.centralQty : (s.qty ?? '-'))}</td>
                     
                      <td>{s.totalCostPrice != null ? currency(s.totalCostPrice) : (s.costPrice != null ? currency(s.costPrice) : '-')}</td>
                      <td>
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <div>
                            <input style={{width:80}} type="number" min={0} value={sel.pct ?? 0} onChange={e => onPctChange(pid, e.target.value)} /> %
                          </div>
                          <div style={{fontSize:12,color:'#666'}}>{sel.sellingPrice != null ? currency(sel.sellingPrice) : (s.sellingPrice != null ? currency(s.sellingPrice) : '-')}</div>
                        </div>
                      </td>
                      <td><input style={{width:80}} type="number" min={0} value={sel.qty} onChange={e => onQtyChange(pid, e.target.value)} /></td>
                      <td>{currency(sel.value)}</td>
                      <td>{s.validity ? new Date(s.validity).toLocaleDateString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{padding:12, display:'flex', justifyContent:'flex-end'}}>
          <button className="btn" type="button" onClick={onSupply} disabled={loading}>{loading ? 'Supplying...' : 'Supply Stock'}</button>
        </div>

        {error ? <div className="mt-2 text-danger" style={{padding:12}}>{error}</div> : null}
      </div>
    </div>
  );
}

window.BranchSupply = BranchSupply;
