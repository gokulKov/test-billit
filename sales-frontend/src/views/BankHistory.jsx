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

  return (
    <div className="card table-card">
      <div className="row" style={{padding:'12px 12px 0 12px'}}>
        <div className="col">
          <label>Filter by Bank</label>
          <select value={bankId} onChange={onBankChange}>
            <option value="">All banks</option>
            {banks.map(b => <option key={b._id} value={b._id}>{b.bankName || b.accountNumber || b._id}</option>)}
          </select>
        </div>
      </div>
      <div className="table-scroll">
        <table className="pretty-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Bank</th>
              <th>Type</th>
              <th className="text-right">Amount</th>
              <th>Reference</th>
              <th>Supplier</th>
              <th className="text-right">Balance After</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <div className="empty-title">No Transactions</div>
                </div>
              </td></tr>
            ) : rows.map(r => (
              <tr key={r._id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.bank_id?.bankName || '-'}</td>
                <td>{r.type}</td>
                <td className="text-right">{currency(r.amount)}</td>
                <td>{r.reference || '-'}</td>
                <td>{r.supplier_id?.supplierName || '-'}</td>
                <td className="text-right">{currency(r.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <div className="mt-2 text-danger" style={{padding:'0 12px 12px'}}>{error}</div> : null}
    </div>
  );
}
