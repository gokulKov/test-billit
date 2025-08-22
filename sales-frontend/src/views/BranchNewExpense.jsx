function BranchNewExpense({ salesUrl, token }) {
  const [form, setForm] = React.useState({ title: '', amount: '', date: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [sales, setSales] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(''); // YYYY-MM-DD used as filter
  const [summary, setSummary] = React.useState({ salesRevenue: 0, stockRevenue: 0, totalRevenue: 0, totalExpense: 0, netRevenue: 0 });

  const onChange = (e) => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); };

  const onDateFilterChange = (e) => {
    const v = e.target.value; // expected YYYY-MM-DDTHH:MM or YYYY-MM-DD depending on input
    // If input type=datetime-local, convert to YYYY-MM-DD for filter
    let day = v;
    if (v && v.includes('T')) day = v.split('T')[0];
    setSelectedDate(day);
    // also set the form date to the selected date if empty
    if (!form.date) {
      // prefer full datetime-local value if provided
      setForm(f => ({ ...f, date: v }));
    }
  };

  const load = async () => {
    try {
      setError('');
      const url = new URL(salesUrl + '/api/branch-expenses');
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load expenses');
      setRows(Array.isArray(data.expenses) ? data.expenses : []);
    } catch (e) { setError(e.message); }
  };

  React.useEffect(() => { load(); }, [token]);

  // load sales for revenue computation
  React.useEffect(() => {
    const loadSales = async () => {
      try {
        const url = new URL(salesUrl + '/api/sales');
        // try to request larger pageSize to include today's sales
        url.searchParams.set('pageSize', '200');
        if (localStorage.getItem('branch_token')) {
          // branch users will have branch_id embedded server-side; still pass nothing
        }
        const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load sales');
        setSales(Array.isArray(data.sales) ? data.sales : []);
      } catch (e) {
        // ignore sales load error; show zeros
      }
    };
    loadSales();
  }, [token]);

  // compute summary when sales/rows change
  React.useEffect(() => {
    try {
      // derive date range from selectedDate if provided, else default to today
      let start, end;
      if (selectedDate) {
        // selectedDate is YYYY-MM-DD
        const parts = String(selectedDate).split('-').map(Number);
        start = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
      } else {
        start = new Date(); start.setHours(0,0,0,0);
        end = new Date(); end.setHours(23,59,59,999);
      }

      // Sales revenue: sum of totalAmount for sales within today
      const todaysSales = (sales || []).filter(s => {
        const t = s.createdAt ? new Date(s.createdAt) : null;
        return t && t >= start && t <= end;
      });
      const salesRevenue = todaysSales.reduce((s, x) => s + (Number(x.totalAmount) || 0), 0);

      // Stock revenue (real cost of sold stock): try to sum cost from sale.items if available
      let stockRevenue = 0;
      for (const s of todaysSales) {
        const items = Array.isArray(s.items) ? s.items : [];
        for (const it of items) {
          // prefer explicit cost fields, fallback to costPrice or totalCostPrice
          const qty = Number(it.qty || it.sellingQty || 0);
          const costUnit = Number(it.costPrice || it.cost || it.unitCost || 0);
          const totalCost = Number(it.totalCostPrice || (costUnit * qty) || 0);
          stockRevenue += totalCost;
        }
      }

      // Filter rows by the same date range (selectedDate) so table and card match
      const filteredRows = (rows || []).filter(r => {
        const t = r.date ? new Date(r.date) : (r.createdAt ? new Date(r.createdAt) : null);
        return t && t >= start && t <= end;
      });
      const totalExpense = filteredRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

      const totalRevenue = salesRevenue - stockRevenue;
      const netRevenue = totalRevenue - totalExpense;
      setSummary({ salesRevenue, stockRevenue, totalRevenue, totalExpense, netRevenue });
    } catch (e) {
      // ignore compute errors
    }
  }, [sales, rows, selectedDate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = Number(form.amount);
    if (!form.title || String(form.title).trim() === '') return setError('Enter an expense title');
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    setLoading(true);
    try {
      const res = await fetch(salesUrl + '/api/branch-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ title: form.title, amount: amt, date: form.date || new Date().toISOString() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Create failed');
      setForm({ title: '', amount: '', date: '' });
      await load();
      try { window.dispatchEvent(new Event('branch-expense-created')); } catch (__) {}
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const currency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

  return (
    <div className="card table-card">
      <div className="row">
        <div className="col">
          <h3>New Expense</h3>
          <form onSubmit={submit}>
            <div className="row">
              <div className="col">
                <label>Expense Title</label>
                <input name="title" value={form.title} onChange={onChange} placeholder="Enter expense title" />
              </div>
              <div className="col">
                <label>Amount</label>
                <input name="amount" value={form.amount} onChange={onChange} placeholder="0.00" />
              </div>
              <div className="col">
                <label>Date</label>
                <input name="date" type="datetime-local" value={form.date} onChange={(e) => { onChange(e); onDateFilterChange(e); }} />
                <div style={{ marginTop: 6 }}>
                  <small style={{ color: '#999' }}></small>
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving…' : '+ Add Expense'}</button>
            </div>
            {error ? <div className="mt-2 text-danger">{error}</div> : null}
          </form>
        </div>
      </div>

      <div className="card mt-3">
        <div className="table-title">Summary</div>
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="stat-card">
              <div className="stat-label">Sales Revenue</div>
              <div className="stat-value">{currency(summary.salesRevenue)}</div>
            </div>
            {/* <div className="stat-card">
              <div className="stat-label">Stock Revenue (cost)</div>
              <div className="stat-value">{currency(summary.stockRevenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Revenue (Sales - Stock)</div>
              <div className="stat-value">{currency(summary.totalRevenue)}</div>
            </div> */}
            <div className="stat-card">
              <div className="stat-label">Total Expense (today)</div>
              <div className="stat-value">{currency(summary.totalExpense)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Net Revenue</div>
              <div className="stat-value">{currency(summary.netRevenue)}</div>
            </div>
          </div>
          <div style={{ marginTop: 10, color: '#666' }}>
            <small>sales Revenue - Stock Revenue = Total Revenue - Total Expense = Net Revenue</small>
          </div>
        </div>
        <div className="table-title">Recent Expenses</div>
        <div className="table-scroll">
          <table className="pretty-table">
            <thead>
              <tr>
                <th style={{width:80}}>S.No</th>
                <th>Title</th>
                <th className="text-right">Amount</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
                {(() => {
                  // apply selectedDate filter to rows for display
                  const startEnd = (() => {
                    if (!selectedDate) return null;
                    const p = String(selectedDate).split('-').map(Number);
                    const s = new Date(p[0], p[1] - 1, p[2], 0, 0, 0, 0);
                    const e = new Date(p[0], p[1] - 1, p[2], 23, 59, 59, 999);
                    return { s, e };
                  })();
                  const filtered = (rows || []).filter((r) => {
                    if (!startEnd) return true;
                    const t = r.date ? new Date(r.date) : (r.createdAt ? new Date(r.createdAt) : null);
                    return t && t >= startEnd.s && t <= startEnd.e;
                  });
                  if (filtered.length === 0) return (<tr><td colSpan={4}><div className="empty-state"><div className="empty-icon">💸</div><div className="empty-title">No expenses found for selected date</div></div></td></tr>);
                  return filtered.map((r, i) => (
                    <tr key={r._id || i}>
                      <td><span className="serial-pill">{i + 1}</span></td>
                      <td>{r.title || '-'}</td>
                      <td className="text-right">{currency(Number(r.amount) || 0)}</td>
                      <td>{r.date ? new Date(r.date).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : '-')}</td>
                    </tr>
                  ));
                })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.BranchNewExpense = BranchNewExpense;
