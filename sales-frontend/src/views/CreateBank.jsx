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
        <div className="card-header">
          <div>
            <h3 className="card-title">Create Payment Method</h3>
            <p className="card-description">Add new bank account or payment method</p>
          </div>
        </div>
        
        <form onSubmit={submit}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input 
                name="bankName" 
                value={form.bankName} 
                onChange={onChange} 
                placeholder="e.g., State Bank of India" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input 
                name="accountNumber" 
                value={form.accountNumber} 
                onChange={onChange} 
                placeholder="Account number" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Holder Name</label>
              <input 
                name="holderName" 
                value={form.holderName} 
                onChange={onChange} 
                placeholder="Account holder name" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input 
                name="address" 
                value={form.address} 
                onChange={onChange} 
                placeholder="Bank address" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                name="phoneNumber" 
                value={form.phoneNumber} 
                onChange={onChange} 
                placeholder="Contact number" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Balance</label>
              <input 
                name="accountBalance" 
                type="number" 
                value={form.accountBalance} 
                onChange={onChange} 
                placeholder="0.00" 
                className="form-input"
              />
            </div>
          </div>
          
          <div className="btn-group mt-4">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? (
                <span className="loading">
                  <span className="spinner"></span>
                  Saving...
                </span>
              ) : '+ Add Payment Method'}
            </button>
          </div>
          
          {error && (
            <div className="alert alert-danger mt-4">
              <div className="alert-icon">❌</div>
              <div>{error}</div>
            </div>
          )}
        </form>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <div>
              <div className="stat-label">Total Balance</div>
              <div className="stat-value">{formatCurrency(totalBalance)}</div>
            </div>
          </div>
          <div className="stat-change positive">Across all accounts</div>
        </div>
      </div>

      {/* Payment Methods Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3 className="table-title">Payment Methods</h3>
            <p className="table-subtitle">Manage your bank accounts and payment methods</p>
          </div>
        </div>
        
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">�</div>
            <div className="empty-title">No Payment Methods</div>
            <div className="empty-description">Add your first bank account or payment method to get started</div>
            <button 
              className="empty-action" 
              onClick={() => {
                const input = document.querySelector('input[name="bankName"]');
                if (input) input.focus();
              }}
            >
              💳 Add Payment Method
            </button>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{width: '80px'}}>No.</th>
                    <th>Branch</th>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>Holder Name</th>
                    <th>Phone Number</th>
                    <th>Balance Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr key={r._id || (startIndex + i)}>
                      <td>
                        <span className="serial-badge">{startIndex + i}</span>
                      </td>
                      <td>{r.branchName || '-'}</td>
                      <td>
                        <span className="cell-strong">{r.bankName || '-'}</span>
                      </td>
                      <td>{r.accountNumber || '-'}</td>
                      <td>{r.holderName || '-'}</td>
                      <td>{r.phoneNumber || '-'}</td>
                      <td>
                        <span className="amount-badge">
                          {formatCurrency(r.accountBalance || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="table-footer">
              <div className="table-info">
                {total === 0 ? 'No payment methods found' : `Showing ${startIndex} to ${endIndex} of ${total} payment methods`}
              </div>
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  type="button" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page <= 1}
                >
                  ← Previous
                </button>
                <span className="pagination-info">Page {page} of {totalPages}</span>
                <button 
                  className="pagination-btn" 
                  type="button" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

