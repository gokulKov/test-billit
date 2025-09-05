function BankHistory({ salesUrl, token }) {
  const [banks, setBanks] = React.useState([]);
  const [bankId, setBankId] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState('');

  const loadBanks = async () => {
    try {
      const res = await fetch(salesUrl + '/api/banks', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load banks');
      setBanks(Array.isArray(data.banks) ? data.banks : []);
    } catch (e) { setError(e.message); }
  };
  const loadTxns = async (id) => {
    try {
      setError('');
      const url = new URL(salesUrl + '/api/bank-transactions');
      if (id) url.searchParams.set('bank_id', id);
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setRows(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (e) { setError(e.message); }
  };
  React.useEffect(() => { loadBanks(); loadTxns(); }, []);

  const onBankChange = (e) => { const id = e.target.value; setBankId(id); loadTxns(id); };
  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  const formatReference = (ref) => {
    if (!ref) return '-';
    try {
      const s = String(ref || '').trim();
      if (!s) return '-';
      // Common patterns created by the server
      if (s.startsWith('Sale:')) return 'Sale completed';
      if (s.toLowerCase().includes('instock')) return 'In-stock payment';
      if (s.toLowerCase().includes('supplier')) return 'Supplier payment';
      // Fallback: shorten long ids but keep readable
      if (s.length > 40) return s.slice(0, 36) + '…';
      return s;
    } catch (e) { return '-'; }
  };

  return (
    <div>
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <div>
              <div className="stat-label">Total Transactions</div>
              <div className="stat-value">{rows.length}</div>
            </div>
          </div>
          <div className="stat-change">All payment activities</div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-header">
            <div className="stat-icon" style={{background: 'var(--gradient-secondary)'}}>📈</div>
            <div>
              <div className="stat-label">Total Inflow</div>
              <div className="stat-value">{currency(rows.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0))}</div>
            </div>
          </div>
          <div className="stat-change positive">Money received</div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-header">
            <div className="stat-icon" style={{background: 'var(--gradient-accent)'}}>📉</div>
            <div>
              <div className="stat-label">Total Outflow</div>
              <div className="stat-value">{currency(Math.abs(rows.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0)))}</div>
            </div>
          </div>
          <div className="stat-change negative">Money spent</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Transaction Filters</h3>
            <p className="card-description">Filter payment history by bank or criteria</p>
          </div>
        </div>
        
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label className="form-label">Filter by Bank</label>
            <select value={bankId} onChange={onBankChange} className="form-input">
              <option value="">All Banks</option>
              {banks.map(b => 
                <option key={b._id} value={b._id}>
                  {b.bankName || b.accountNumber || b._id}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3 className="table-title">Payment Transactions</h3>
            <p className="table-subtitle">Complete history of all payment activities</p>
          </div>
        </div>
        
        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <div className="empty-title">No Payment History</div>
            <div className="empty-description">Payment transactions will appear here once you start making payments</div>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{width: '180px'}}>Date & Time</th>
                    <th style={{width: '150px'}}>Bank Account</th>
                    <th style={{width: '100px'}}>Type</th>
                    <th style={{width: '120px'}}>Amount</th>
                    <th style={{width: '140px'}}>Reference</th>
                    <th style={{width: '150px'}}>Supplier</th>
                    <th style={{width: '120px'}}>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div className="datetime-cell">
                          <div className="date-part">{new Date(r.createdAt).toLocaleDateString()}</div>
                          <div className="time-part">{new Date(r.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td>
                        <div className="bank-cell">
                          <span className="cell-strong">{r.bank_id?.bankName || 'Unknown Bank'}</span>
                          <div className="cell-sub">{r.bank_id?.accountNumber || '-'}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${r.amount > 0 ? 'success' : 'danger'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td>
                        <span className={`amount-badge ${r.amount > 0 ? 'positive' : 'negative'}`}>
                          {currency(r.amount)}
                        </span>
                      </td>
                      <td>
                        <div className="reference-cell">
                          {formatReference(r.reference)}
                        </div>
                      </td>
                      <td>
                        <div className="supplier-cell">
                          {r.supplier_id?.supplierName || '-'}
                        </div>
                      </td>
                      <td>
                        <span className="balance-badge">
                          {currency(r.balanceAfter)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {error && (
          <div className="alert alert-danger">
            <div className="alert-icon">❌</div>
            <div>{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
