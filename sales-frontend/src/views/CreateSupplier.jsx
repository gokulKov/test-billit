function CreateSupplier({ salesUrl, token }) {
  const [form, setForm] = React.useState({
    supplierName: '', agencyName: '', phoneNumber: '', address: '', gstNumber: '', panNumber: ''
  });
  const [rows, setRows] = React.useState([]);
  const [inStockEntries, setInStockEntries] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const fetchSuppliers = async () => {
    try {
      setError('');
      const res = await fetch(salesUrl + '/api/suppliers', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      const list = Array.isArray(data.suppliers) ? data.suppliers : [];
      setRows(list);
      setPage(1);
    } catch (err) { setError(err.message); }
  };
  const fetchInStock = async () => {
    try {
      const res = await fetch(salesUrl + '/api/in-stock', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load in-stock');
      setInStockEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (err) { console.error(err); }
  };

  React.useEffect(() => { fetchSuppliers(); fetchInStock(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(salesUrl + '/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setForm({ supplierName: '', agencyName: '', phoneNumber: '', address: '', gstNumber: '', panNumber: '' });
      await fetchSuppliers();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  // pagination
  const total = rows.length;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visible = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  // Derived maps
  const supplierAmountMap = React.useMemo(() => {
    const m = {};
    for (const e of inStockEntries) {
      const sid = e.supplier_id?._id || e.supplier_id; if (!sid) continue;
      m[sid] = (m[sid] || 0) + (Number(e.supplierAmount) || 0);
    }
    return m;
  }, [inStockEntries]);
  const supplierItemsCountMap = React.useMemo(() => {
    const m = {};
    for (const e of inStockEntries) {
      const sid = e.supplier_id?._id || e.supplier_id; if (!sid) continue;
      const cnt = Array.isArray(e.items) ? e.items.length : 0;
      m[sid] = (m[sid] || 0) + cnt;
    }
    return m;
  }, [inStockEntries]);

  return (
    <div>
      <div className="card">
        <form onSubmit={submit}>
          <div className="row">
            <div className="col">
              <label>Supplier Name</label>
              <input name="supplierName" value={form.supplierName} onChange={onChange} placeholder="Optional" />
            </div>
            <div className="col">
              <label>Agency Name</label>
              <input name="agencyName" value={form.agencyName} onChange={onChange} placeholder="Optional" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <label>Phone Number</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="Optional" />
            </div>
            <div className="col">
              <label>Address</label>
              <input name="address" value={form.address} onChange={onChange} placeholder="Optional" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <label>GST Number</label>
              <input name="gstNumber" value={form.gstNumber} onChange={onChange} placeholder="Optional" />
            </div>
            <div className="col">
              <label>PAN Number</label>
              <input name="panNumber" value={form.panNumber} onChange={onChange} placeholder="Optional" />
            </div>
          </div>
          <div className="row mt-3">
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
          {error ? <div className="mt-2 text-danger">{error}</div> : null}
        </form>
      </div>

      <div className="card mt-3 table-card">
        <div className="table-title">Saved Suppliers</div>
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📇</div>
            <div className="empty-title">No Records Found</div>
            <div className="empty-sub">No suppliers found. Create one above to get started.</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="pretty-table">
              <thead>
                <tr>
                  <th style={{width:80}}>S.No</th>
                  <th>Supplier Name</th>
                  <th>Agency Name</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>GST Number</th>
                  <th>PAN Number</th>
                  <th className="text-right">Supplier Amount</th>
                  <th className="text-right">Items Count</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={r._id || (startIndex + i)}>
                    <td><span className="serial-pill">{startIndex + i}</span></td>
                    <td><span className="cell-strong">{r.supplierName || '-'}</span></td>
                    <td>{r.agencyName || '-'}</td>
                    <td>{r.phoneNumber || '-'}</td>
                    <td>{r.address || '-'}</td>
                    <td>{r.gstNumber || '-'}</td>
                    <td>{r.panNumber || '-'}</td>
                    <td className="text-right">{supplierAmountMap[r._id] ? supplierAmountMap[r._id] : 0}</td>
                    <td className="text-right">{supplierItemsCountMap[r._id] ? supplierItemsCountMap[r._id] : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <div className="table-range">
            {total === 0 ? 'Showing 1 to 0 of 0 results' : `Showing ${startIndex} to ${endIndex} of ${total} results`}
          </div>
          <div className="pager">
            <button className="pager-btn" type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
            <button className="pager-btn" type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
