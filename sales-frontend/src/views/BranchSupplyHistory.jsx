function BranchSupplyHistory({ salesUrl, token }) {
  const [rows, setRows] = React.useState([]);
  const [branches, setBranches] = React.useState([]);
  const [branchId, setBranchId] = React.useState('');
  const [error, setError] = React.useState('');
  const [filterDate, setFilterDate] = React.useState('');

  const loadBranches = async () => {
    try {
      const res = await fetch(salesUrl + '/api/branches', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load branches');
      setBranches(Array.isArray(data.branches) ? data.branches : []);
    } catch (e) { setError(e.message); }
  };

  const load = async (bid) => {
    try {
      setError('');
      const url = new URL(salesUrl + '/api/branch-supplies');
      if (bid) url.searchParams.set('branch_id', bid);
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setRows(Array.isArray(data.supplies) ? data.supplies : []);
    } catch (e) { setError(e.message); }
  };

  React.useEffect(() => { loadBranches(); load(); }, [token]);
  React.useEffect(() => {
    const onUpdated = (e) => {
      // when branch stock changes, reload supplies (and branch list)
      loadBranches();
      load();
    };
    window.addEventListener('branch-stock-updated', onUpdated);
    return () => window.removeEventListener('branch-stock-updated', onUpdated);
  }, [token]);

  const onBranchChange = (e) => { const id = e.target.value; setBranchId(id); load(id); };

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  const filteredRows = React.useMemo(() => {
    if (!filterDate) return rows;
    const selectedDate = new Date(filterDate).toDateString();
    return rows.filter(supply => {
      const supplyDate = new Date(supply.createdAt || supply.updatedAt || new Date()).toDateString();
      return supplyDate === selectedDate;
    });
  }, [rows, filterDate]);

  return (
    <div className="card table-card">
      <div className="row" style={{ padding: '12px 12px 0 12px' }}>
        <div className="col">
          <label>Filter by Branch</label>
          <select value={branchId} onChange={onBranchChange}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name || b._id}</option>)}
          </select>
        </div>
        <div className="col">
          <label>Filter by Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ marginBottom: '12px', padding: '8px', width: '100%' }}
          />
        </div>
      </div>

      <div className="table-scroll">
        {branchId ? (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Cost Price</th>
                <th>Product Validity</th>
                <th>Selling Price (pct / price)</th>
                <th>Unit Price</th>
                <th>Supply Qty</th>
                <th>Supply Value</th>
                <th>Sending Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const flat = [];
                filteredRows.forEach(s => {
                  const when = s.createdAt || s.updatedAt || new Date();
                  const supplier = s.supplier_id?.supplierName || s.supplierName || '-';
                  (Array.isArray(s.items) ? s.items : []).forEach(it => {
                    flat.push({
                      supplier,
                      productName: it.productName || it.name || '-0',
                      brand: it.brand || '-',
                      model: it.model || '- ',
                      costPrice: it.costPrice ?? it.cost ?? 0,
                      validity: it.validity || null,
                      pct: it.pct ?? null,
                      unitPrice: it.unitSellingPrice ?? it.sellingPrice ?? 0,
                      qty: it.qty ?? 0,
                      value: it.value ?? ((it.unitSellingPrice ?? it.sellingPrice ?? 0) * (it.qty ?? 0)),
                      when
                    });
                  });
                });
                if (flat.length === 0) return (<tr><td colSpan={11}><div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">No items found for this branch</div></div></td></tr>);
                return flat.map((r, i) => (
                  <tr key={i}>
                    {/* <td>{r.supplier || '-'}</td> */}
                    <td>{r.productName}</td>
                    <td>{r.brand}</td>
                    <td>{r.model}</td>
                    <td>{r.costPrice != null ? currency(r.costPrice) : '-'}</td>
                    <td>{r.validity ? new Date(r.validity).toLocaleDateString() : '-'}</td>
                    <td>{r.pct != null ? `${r.pct}% / ${currency(r.unitPrice)}` : '-'}</td>
                    <td>{currency(r.unitPrice)}</td>
                    <td>{r.qty}</td>
                    <td>{currency(r.value)}</td>
                    <td>{new Date(r.when).toLocaleString()}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        ) : ( ''
                 )}
      </div>

      {error ? <div className="mt-2 text-danger" style={{ padding: '0 12px 12px' }}>{error}</div> : null}
    </div>
  );
}

window.BranchSupplyHistory = BranchSupplyHistory;
