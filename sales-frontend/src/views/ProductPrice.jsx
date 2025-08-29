function ProductPrice({ salesUrl, token }) {
  const [productNo, setProductNo] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [rowEdits, setRowEdits] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function showProduct(e) {
    if (e && e.preventDefault) e.preventDefault();
    const needle = (productNo || '').toString().trim();
    if (!needle) { setError('Enter a product no'); return; }
    setError('');
    setLoading(true);
    try {
      const found = await fetchProduct(needle);
      if (found.length === 0) {
        setRows([]);
        alert('Product not available');
      } else {
        setRows(found);
        // log current quantities
        console.log('Current quantities for', needle, found.map(r => ({ productNo: r.productNo || r.productId, qty: r.qty != null ? r.qty : (r.centralQty != null ? r.centralQty : 0) })));
      }
    } catch (err) {
      console.error('ProductPrice fetch error', err);
      alert('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProduct(needle) {
    const base = (salesUrl || '').replace(/\/$/, '');
    const url = base + '/api/branch-stock?productNo=' + encodeURIComponent(needle);
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
    const data = await res.json();
    if (!data || !data.success) return [];
    return Array.isArray(data.rows) ? data.rows : [];
  }

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  async function saveWhatsappStock(key, row) {
    try {
      const edit = rowEdits[key] || {};
  const supplyQty = Number(edit.supplyQty || 0);
  const sellPercent = Number(edit.sellPercent || 0);
  // compute selling price same as BranchSupply.jsx: pct ? cost * (1 + pct/100) : row.sellingPrice
  const cost = Number(row.costPrice ?? row.cost ?? row.totalCostPrice ?? row.totalCost ?? 0);
  const rawSelling = sellPercent ? (cost * (1 + sellPercent / 100)) : Number(row.sellingPrice || 0);
  const sellingPrice = Number(Number(rawSelling || 0).toFixed(2));
      // set saving flag
      setRowEdits(s => ({ ...s, [key]: { ...(s[key] || {}), saving: true } }));

      const base = (salesUrl || '').replace(/\/$/, '');
      const payload = {
        productNo: row.productNo || row.productId || '',
        productName: row.productName || '',
        brand: row.brand || '',
        model: row.model || '',
  supplyQty,
  sellPercent,
  sellingPrice,
  costPrice: cost,
  totalCost: Number(row.totalCostPrice || row.totalCost || 0)
      };

      // log current qty before transfer
      const currentQty = (row.qty != null) ? row.qty : (row.centralQty != null ? row.centralQty : 0);
      console.log('Before transfer:', { productNo: payload.productNo, currentQty });

      const res = await fetch(base + '/api/whatsapp-stock', {
        method: 'POST', headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Save failed');
      } else {
        alert(data.message || 'Saved');
        // reflect saved state
        setRowEdits(s => ({ ...s, [key]: { ...s[key], saving: false } }));
        // fetch updated product and log new qty
        try {
          const refreshed = await fetchProduct(payload.productNo);
          const updated = refreshed.find(rr => (rr.productNo || rr.productId) === payload.productNo);
          const newQty = updated ? (updated.qty != null ? updated.qty : (updated.centralQty != null ? updated.centralQty : 0)) : null;
          console.log('Transfer completed:', { productNo: payload.productNo, supplyQty, before: currentQty, after: newQty });
        } catch (e) { console.error('Failed to fetch refreshed product', e); }
      }
    } catch (err) {
      console.error('saveWhatsappStock error', err);
      alert('Save failed');
      setRowEdits(s => ({ ...s, [key]: { ...s[key], saving: false } }));
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Product Price</h3>
        <form onSubmit={showProduct} style={{ marginBottom: 12 }}>
          <label>Product No</label><br />
          <input value={productNo} onChange={e => setProductNo(e.target.value)} placeholder="Enter product no" />
          <button className="btn" style={{ marginLeft: 8 }} onClick={showProduct} disabled={loading}>{loading ? 'Loading...' : 'Show'}</button>
          <button type="button" className="btn secondary" style={{ marginLeft: 8 }} onClick={() => { setProductNo(''); setRows([]); setError(''); }}>Clear</button>
        </form>

        {error ? <div style={{ color: 'red' }}>{error}</div> : null}

        <div className="card mt-3 table-card">
          <div className="table-title">Product Results</div>
          {rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-title">No Records Found</div>
              <div className="empty-sub">Enter a product no and click Show to fetch product price details.</div>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="pretty-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>S.No</th>
                    <th>Product No</th>
                    <th>Product Name</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Qty</th>
                    <th>Total Cost</th>
                    <th>Selling Price</th>
                    <th>Supply Qty</th>
                     <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const key = r.productNo || r.productId || i;
                    const edit = rowEdits[key] || { sellPercent: '', supplyQty: '' };
                    return (
                    <tr key={key}>
                      <td><span className="serial-pill">{i + 1}</span></td>
                      <td><span className="cell-strong">{r.productNo || '-'}</span></td>
                      <td>{r.productName || '-'}</td>
                      <td>{r.brand || '-'}</td>
                      <td>{r.model || '-'}</td>
                      <td>{(r.qty != null) ? r.qty : (r.centralQty != null ? r.centralQty : '-')} {/* Available InStock quantity */}</td>
                      <td>{(Number(r.totalCostPrice || r.totalCost || 0)).toFixed(2)}</td>
                      <td>
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <div>
                            <input style={{ width: 80 }} placeholder="Sell %" value={edit.sellPercent}
                              onChange={e => setRowEdits(s => ({ ...s, [key]: { ...edit, sellPercent: e.target.value } }))} /> %
                          </div>
                          <div style={{fontSize:12,color:'#666'}}>{(() => {
                            const pct = Number(edit.sellPercent || 0);
                            const cost = Number(r.costPrice ?? r.cost ?? r.totalCostPrice ?? r.totalCost ?? 0);
                            const sp = pct ? (cost * (1 + pct / 100)) : Number(r.sellingPrice || 0);
                            return sp ? currency(Number(sp.toFixed(2))) : '-';
                          })()}</div>
                        </div>
                      </td>
                      <td>
                        <input style={{ width: 80 }} placeholder="Supply Qty" type="number" min={0} max={r.qty != null ? r.qty : (r.centralQty != null ? r.centralQty : 99999)} value={edit.supplyQty}
                          onChange={e => setRowEdits(s => ({ ...s, [key]: { ...edit, supplyQty: e.target.value } }))} />
                        {Number(edit.supplyQty) > (r.qty != null ? r.qty : (r.centralQty != null ? r.centralQty : 99999)) && (
                          <div style={{ color: 'red', fontSize: 12 }}>Exceeds available stock</div>
                        )}
                      </td>
                      <td>
                        <button className="btn" onClick={() => saveWhatsappStock(key, r)}
                          disabled={edit.saving || Number(edit.supplyQty) > (r.qty != null ? r.qty : (r.centralQty != null ? r.centralQty : 99999))}
                        >{edit.saving ? 'Saving...' : 'Save'}</button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.ProductPrice = ProductPrice;
