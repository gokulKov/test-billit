function InStockView({ salesUrl, token }) {
  const [suppliers, setSuppliers] = React.useState([]);
  const [banks, setBanks] = React.useState([]);
  const [entries, setEntries] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState('');
  const [bankId, setBankId] = React.useState('');
  const [supplierAmount, setSupplierAmount] = React.useState('');
  const [items, setItems] = React.useState([
    { productNo: '', productName: '', brand: '', model: '', quantity: 1, costPrice: '', validity: '' }
  ]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadSuppliers = async () => {
    try {
      const res = await fetch(salesUrl + '/api/suppliers', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load suppliers');
      setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
    } catch (e) { setError(e.message); }
  };
  const loadBanks = async () => {
    try {
      const res = await fetch(salesUrl + '/api/banks', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load banks');
      setBanks(Array.isArray(data.banks) ? data.banks : []);
    } catch (e) { setError(e.message); }
  };
  const loadEntries = async () => {
    try {
      const res = await fetch(salesUrl + '/api/in-stock', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) { setError(e.message); }
  };
  React.useEffect(() => { loadSuppliers(); loadBanks(); loadEntries(); }, []);

  const sumCost = items.reduce((s, it) => s + ((Number(it.costPrice) || 0) * (Number(it.quantity) || 1)), 0);
  const canSubmit = supplierId && bankId && Number(supplierAmount) === sumCost && items.every(it => it.productName);

  const addRow = () => setItems(it => [...it, { productNo: '', productName: '', brand: '', model: '', quantity: 1, costPrice: '', validity: '' }]);
  const updateItem = (idx, field, value) => setItems(list => list.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const removeRow = (idx) => setItems(list => list.filter((_, i) => i !== idx));

  const resetModal = () => {
    setSupplierId(''); setBankId(''); setSupplierAmount('');
  setItems([{ productNo: '', productName: '', brand: '', model: '', quantity: 1, costPrice: '', validity: '' }]);
    setError('');
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(salesUrl + '/api/in-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          supplier_id: supplierId,
          bank_id: bankId,
          supplierAmount: Number(supplierAmount) || 0,
          items: items.map(it => ({
            productNo: it.productNo || '',
            productName: it.productName,
            brand: it.brand,
            model: it.model,
            quantity: Number(it.quantity) || 1,
            costPrice: Number(it.costPrice) || 0,
            validity: it.validity,
          }))
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setOpen(false);
      resetModal();
      await loadEntries();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const selectedSupplierTotal = React.useMemo(() => {
    if (!supplierId) return 0;
    const fromEntries = entries.reduce((sum, e) => {
      const sid = e.supplier_id?._id || e.supplier_id;
      if (sid !== supplierId) return sum;
      return sum + (Number(e.supplierAmount) || 0);
    }, 0);
    // If modal is open, include unsaved items sum (sumCost) so users see the running total
    const unsaved = open ? sumCost : 0;
    return fromEntries + unsaved;
  }, [entries, supplierId, open, sumCost]);

  return (
    <div>
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">📦</div>
            <div>
              <div className="stat-label">Total Products</div>
              <div className="stat-value">{entries.reduce((sum, e) => sum + (Array.isArray(e.items) ? e.items.length : 0), 0)}</div>
            </div>
          </div>
          <div className="stat-change">Unique items in stock</div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-header">
            <div className="stat-icon" style={{background: 'var(--gradient-secondary)'}}>📊</div>
            <div>
              <div className="stat-label">Total Quantity</div>
              <div className="stat-value">{entries.reduce((sum, e) => sum + (Array.isArray(e.items) ? e.items.reduce((itemSum, it) => itemSum + (Number(it.quantity) || 0), 0) : 0), 0)}</div>
            </div>
          </div>
          <div className="stat-change">Items available</div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-header">
            <div className="stat-icon" style={{background: 'var(--gradient-accent)'}}>💰</div>
            <div>
              <div className="stat-label">Inventory Value</div>
              <div className="stat-value">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(selectedSupplierTotal)}</div>
            </div>
          </div>
          <div className="stat-change">Total stock value</div>
        </div>
      </div>

      {/* Action Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Inventory Management</h3>
            <p className="card-description">Add new products to your inventory</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
            📦 Add New Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3 className="table-title">Master Inventory</h3>
            <p className="table-subtitle">Complete list of all products in your inventory</p>
          </div>
        </div>
        
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No Inventory Items</div>
            <div className="empty-description">Add your first product to inventory to get started</div>
            <button 
              className="empty-action" 
              onClick={() => setOpen(true)}
            >
              📦 Add First Product
            </button>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{width: '150px'}}>Supplier</th>
                    <th style={{width: '120px'}}>Product No</th>
                    <th style={{width: '180px'}}>Product Name</th>
                    <th style={{width: '120px'}}>Brand</th>
                    <th style={{width: '120px'}}>Model</th>
                    <th style={{width: '80px'}}>Qty</th>
                    <th style={{width: '90px'}}>Total Qty</th>
                    <th style={{width: '110px'}}>Cost Price</th>
                    <th style={{width: '120px'}}>Validity</th>
                    <th style={{width: '120px'}}>Product Date</th>
                    <th style={{width: '140px'}}>Created</th>
                  </tr>
                </thead>
                <tbody>
                    {entries.flatMap((e) => (
                        (Array.isArray(e.items) ? e.items : []).map((it, idx) => (
                        <tr key={`${e._id}-${idx}`}>
                          <td>
                            <div className="supplier-cell">
                              <span className="cell-strong">{e.supplier_id?.supplierName || 'Unknown Supplier'}</span>
                              <div className="cell-sub">{e.supplier_id?.agencyName || '-'}</div>
                            </div>
                          </td>
                          <td>
                            <span className="product-code">{it.productNo || '-'}</span>
                          </td>
                          <td>
                            <div className="product-cell">
                              <span className="cell-strong">{it.productName || '-'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="brand-text">{it.brand || '-'}</span>
                          </td>
                          <td>
                            <span className="model-text">{it.model || '-'}</span>
                          </td>
                          <td>
                            <span className="count-badge">{it.quantity ?? 0}</span>
                          </td>
                          <td>
                            <span className="count-badge">{it.totalQuantity ?? it.quantity ?? 0}</span>
                          </td>
                          <td>
                            <span className="amount-badge">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(it.costPrice || 0)}
                            </span>
                          </td>
                          <td>
                            <div className="date-cell">
                              {it.validity ? new Date(it.validity).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          {/* Product Date: days in store (inclusive from createdAt to today) */}
                          <td>{(() => {
                              try {
                                const created = new Date(e.createdAt);
                                if (isNaN(created.getTime())) return '-';
                                const msPerDay = 1000 * 60 * 60 * 24;
                                const days = Math.floor((Date.now() - created.getTime()) / msPerDay) + 1;
                                return `${days} day${days !== 1 ? 's' : ''}`;
                              } catch (err) { return '-'; }
                            })()}</td>
                          <td>{new Date(e.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      {open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div style={{fontWeight:800}}>Add In Stock</div>
              <button className="btn secondary" onClick={() => { setOpen(false); resetModal(); }}>Close</button>
            </div>
            <div className="modal-body" onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); if(canSubmit && !saving) submit(); } }}>
              {error ? <div className="text-danger" style={{marginBottom:8}}>{error}</div> : null}
              <div className="row">
                <div className="col">
                  <label>Supplier</label>
                  <select value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName || s.agencyName || s._id}</option>)}
                  </select>
                </div>
                <div className="col">
                  <label>Bank</label>
                  <select value={bankId} onChange={e=>setBankId(e.target.value)}>
                    <option value="">Select bank</option>
                    {banks.map(b => <option key={b._id} value={b._id}>{b.bankName || b.accountNumber || b._id}</option>)}
                  </select>
                </div>
                <div className="col">
                  <label>Supplier Amount</label>
                  <input type="number" value={supplierAmount} onChange={e=>setSupplierAmount(e.target.value)} placeholder="Sum of cost x qty" />
                </div>
              </div>

              <div className="table-scroll mt-3">
                <table className="pretty-table">
                  <thead>
                    <tr>
                      <th>Product No</th>
                      <th>Product Name</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Qty</th>
                      <th>Cost Price</th>
                      <th>Product Validity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td><input value={it.productNo} onChange={e=>updateItem(idx,'productNo',e.target.value)} placeholder="Product No (optional)" /></td>
                        <td><input value={it.productName} onChange={e=>updateItem(idx,'productName',e.target.value)} placeholder="Name" /></td>
                        <td><input value={it.brand} onChange={e=>updateItem(idx,'brand',e.target.value)} placeholder="Brand" /></td>
                        <td><input value={it.model} onChange={e=>updateItem(idx,'model',e.target.value)} placeholder="Model" /></td>
                        <td style={{maxWidth:140}}><input type="number" style={{width:'120px'}} value={it.quantity === undefined ? '' : it.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} placeholder="1" /></td>
                        <td><input type="number" value={it.costPrice} onChange={e=>updateItem(idx,'costPrice',e.target.value)} placeholder="0" /></td>
                        <td><input type="date" value={it.validity} onChange={e=>updateItem(idx,'validity',e.target.value)} /></td>
                        <td><button className="btn secondary" type="button" onClick={()=>removeRow(idx)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row mt-2" style={{justifyContent:'space-between'}}>
                <button className="btn secondary" type="button" onClick={addRow}>Add Row</button>
                <div style={{color:'#9ca3af'}}>Sum of cost x qty: {sumCost} {Number(supplierAmount) !== sumCost ? '(must equal Supplier Amount)' : ''}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" disabled={!canSubmit || saving} onClick={submit}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
