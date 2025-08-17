// CreateBank view implementation moved from main.jsx
function CreateBank({ salesUrl, token }) {
  const [form, setForm] = React.useState({
    bankName: '', accountNumber: '', holderName: '', address: '', phoneNumber: '', accountBalance: ''
  });
  const [rows, setRows] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const fetchBanks = async () => {
    try {
      setError('');
      const res = await fetch(salesUrl + '/api/banks', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      const list = Array.isArray(data.banks) ? data.banks : [];
      setRows(list);
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  React.useEffect(() => { fetchBanks(); }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(salesUrl + '/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          holderName: form.holderName,
          address: form.address,
          phoneNumber: form.phoneNumber,
          accountBalance: form.accountBalance !== '' ? Number(form.accountBalance) : undefined,
          branchName: localStorage.getItem('branch_token') ? (function(){ try{ const p = JSON.parse(atob(localStorage.getItem('branch_token').split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); return p.name || ''; }catch(e){return '';} })() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setForm({ bankName: '', accountNumber: '', holderName: '', address: '', phoneNumber: '', accountBalance: '' });
      await fetchBanks();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  // pagination and helpers
  const total = rows.length;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visible = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  const totalBalance = React.useMemo(() => rows.reduce((sum, r) => {
    const val = typeof r.accountBalance === 'number' ? r.accountBalance : Number(r.accountBalance);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0), [rows]);
  const formatCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  return (
    <div>
      <div className="card">
        <form onSubmit={submit}>
          <div className="row">
            <div className="col">
              <label>Bank Name</label>
              <input name="bankName" value={form.bankName} onChange={onChange} placeholder="Optional" />
            </div>
            <div className="col">
              <label>Account Number</label>
              <input name="accountNumber" value={form.accountNumber} onChange={onChange} placeholder="Optional" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <label>Holder Name</label>
              <input name="holderName" value={form.holderName} onChange={onChange} placeholder="Optional" />
            </div>
            <div className="col">
              <label>Address</label>
              <input name="address" value={form.address} onChange={onChange} placeholder="Optional" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <label>Phone Number</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="Optional" />
            </div>
            <div className="col">
              <label>Account Balance</label>
              <input name="accountBalance" type="number" value={form.accountBalance} onChange={onChange} placeholder="Optional" />
            </div>
          </div>
          <div className="row mt-3">
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
          {error ? <div className="mt-2 text-danger">{error}</div> : null}
        </form>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Balance Amount</div>
          <div className="stat-value">{formatCurrency(totalBalance)}</div>
        </div>
      </div>

      <div className="card mt-3 table-card">
        <div className="table-title">Saved Banks</div>
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No Records Found</div>
            <div className="empty-sub">No banks found. Create one above to get started.</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="pretty-table">
              <thead>
                <tr>
                  <th style={{width:80}}>S.No</th>
                    <th>Branch</th>
                  <th>Bank Name</th>
                  <th>Account Number</th>
                  <th>Holder Name</th>
                  <th>Phone Number</th>
                  <th className="text-right">Balance Amount</th>
                </tr>
              </thead>
              <tbody>
        {visible.map((r, i) => (
                  <tr key={r._id || (startIndex + i)}>
                    <td><span className="serial-pill">{startIndex + i}</span></td>
          <td>{r.branchName || '-'}</td>
                    <td><span className="cell-strong">{r.bankName || '-'}</span></td>
                    <td>{r.accountNumber || '-'}</td>
                    <td>{r.holderName || '-'}</td>
                    <td>{r.phoneNumber || '-'}</td>
                    <td className="text-right">{r.accountBalance === 0 ? 0 : (r.accountBalance ?? '-')}</td>
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

