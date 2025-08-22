// Sidebar and HeaderBar are now loaded from src/components via index.html

function App() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [token, setToken] = React.useState(localStorage.getItem('sales_token') || '');
  const [hasAccess, setHasAccess] = React.useState(null); // null=unknown, true/false
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [view, setView] = React.useState((location.hash || '#bank').slice(1));
  const [planId, setPlanId] = React.useState('');
  const [branchLimit, setBranchLimit] = React.useState(0);
  const [branchUser, setBranchUser] = React.useState(null);

  const SALES_URL = 'http://127.0.0.1:9000';

  const decodeJwt = (tk) => {
    try {
      const base64 = tk.split('.')[1];
      const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch { return null; }
  };

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(SALES_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Login failed');
      if (!data.token) throw new Error('No token returned');
  // Ensure branch token is removed so only one token type exists in this browser
  try { localStorage.removeItem('branch_token'); } catch (e) {}
  localStorage.setItem('sales_token', data.token);
  setToken(data.token);
  setHasAccess(true);
  setBranchUser(null);
  try { window.dispatchEvent(new Event('sales-login')); } catch (__) {}
      const payload = data.payload || decodeJwt(data.token);
      if (payload?.mongoPlanId) setPlanId(payload.mongoPlanId);
      if (Number.isFinite(payload?.branchLimit)) setBranchLimit(payload.branchLimit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async (tk = token) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(SALES_URL + '/auth/verify', { headers: { Authorization: 'Bearer ' + tk } });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.message || 'Token invalid');
      setHasAccess(true);
      if (data.token) {
        localStorage.setItem('sales_token', data.token);
        setToken(data.token);
      }
      const decoded = data.decoded || data.payload || decodeJwt(data.token || tk);
      if (decoded?.mongoPlanId) setPlanId(decoded.mongoPlanId);
      if (Number.isFinite(decoded?.branchLimit)) setBranchLimit(decoded.branchLimit);
    } catch (err) {
      setError(err.message);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (localStorage.getItem('token') && !localStorage.getItem('sales_token')) {
      localStorage.removeItem('token');
    }
    if (token && hasAccess === null) checkAccess(token);

    const onHash = () => setView((location.hash || '#bank').slice(1));
    window.addEventListener('hashchange', onHash);

    // Handle branch-login events dispatched from BranchLogin so same-tab updates work
    const onBranchLoginEvent = () => {
      const bt = localStorage.getItem('branch_token');
      if (bt) {
        const d = decodeJwt(bt);
        setBranchUser(d || null);
        // Ensure sales token isn't used
        setToken('');
        setHasAccess(false);
        try { location.hash = '#branch'; } catch (_) {}
      }
    };
    window.addEventListener('branch-login', onBranchLoginEvent);

    const onSalesLoginEvent = () => {
      // sales login happened elsewhere in-app/tab: clear branchUser
      setBranchUser(null);
    };
    window.addEventListener('sales-login', onSalesLoginEvent);

    // update branchUser state when branch_token changes elsewhere
    const syncBranchUser = () => {
      const bt = localStorage.getItem('branch_token');
      if (bt) {
        const d = decodeJwt(bt);
        setBranchUser(d || null);
      } else setBranchUser(null);
    };
    syncBranchUser();
    window.addEventListener('storage', syncBranchUser);

    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('storage', syncBranchUser);
      window.removeEventListener('branch-login', onBranchLoginEvent);
      window.removeEventListener('sales-login', onSalesLoginEvent);
    };
  }, []);

  if (loading && hasAccess === null) return <div>Loading…</div>;
  // If we're a branch user, render the app immediately (use branch_token as effective token)
  const effectiveToken = branchUser ? (localStorage.getItem('branch_token') || '') : token;

  // If we're not a branch user and we don't have a valid sales token, show auth screens
  if (!branchUser && ((!token) || hasAccess === false)) {
    // Allow visiting public branch-login route even without sales token
    if ((location.hash || '#bank').slice(1) === 'branch-login') {
      return <div className="app"><HeaderBar title="Branch Dashboard" subtitle="" /><div className="content"><BranchLogin salesUrl={SALES_URL} /></div></div>;
    }

    // No sales token and not a branch user -> show sales login
    return (
      <div className="auth">
        <h2 style={{ marginTop: 0 }}>Sales Login</h2>
        <form onSubmit={login}>
          <div className="mt-2">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="mt-2">
            <label>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
          </div>
          <div className="row mt-3">
            <button className="btn" disabled={loading} type="submit">{loading ? 'Please wait…' : 'Login'}</button>
            {token ? <button className="btn secondary" onClick={(e) => { e.preventDefault(); checkAccess(); }}>Verify token</button> : null}
          </div>
        </form>
        {error && <div className="mt-2 text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div className="app">
  <Sidebar active={view} onSelect={setView} planId={planId} branchLimit={branchLimit} branchUser={branchUser} />
      <div className="main">
        <HeaderBar
          title={
            branchUser ? 'Branch Dashboard' :
              view === 'bank' ? 'Create Bank'
                : view === 'bank-history' ? 'Bank History'
                  : view === 'supplier' ? 'Create Supplier'
                    : view === 'branch' ? 'Create Branch'
                      : 'In Stock'
          }
          subtitle={
            branchUser ? `Welcome, ${branchUser.name || 'Branch'}` :
              view === 'bank' ? 'Add optional bank details and see them listed below'
                : view === 'bank-history' ? 'View debits and credits with running balance'
                  : view === 'supplier' ? 'Add supplier details and see them listed below'
                    : view === 'branch' ? 'Create and manage branches for your shop'
                                : 'Track incoming stock purchases from suppliers'
                    }
        />

        <div className="content">
          {branchUser ? (
            // branch-specific welcome screen as the first nav item
            view === 'branch-welcome' || view === '' || view === 'branch' ? (
              <div className="card"><h3>Welcome</h3><p>Welcome, {branchUser.name || 'Branch User'}!</p></div>
            ) : null
          ) : null}

          

          {view === 'bank' ? (
            <CreateBank salesUrl={SALES_URL} token={effectiveToken} />
          ) : view === 'bank-history' ? (
            <BankHistory salesUrl={SALES_URL} token={effectiveToken} />
          ) : (!branchUser && view === 'supplier') ? (
            <CreateSupplier salesUrl={SALES_URL} token={effectiveToken} />
          ) : (!branchUser && view === 'branch') ? (
            (planId === 'sales-gold' || planId === 'sales-premium') ? (
              <CreateBranch salesUrl={SALES_URL} token={effectiveToken} planId={planId} branchLimit={branchLimit} />
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">🔒</div>
                  <div className="empty-title">Upgrade Required</div>
                  <div className="empty-sub">Branch management is available on Sales Gold and Premium plans.</div>
                </div>
              </div>
            )
          ) : view === 'branch-login' ? (
            <BranchLogin salesUrl={SALES_URL} />
          ) : view === 'branch-supply' ? (
            <BranchSupply salesUrl={SALES_URL} token={effectiveToken} />
          ) : view === 'branch-supply-history' ? (
            (window.BranchSupplyHistory ? React.createElement(window.BranchSupplyHistory, { salesUrl: SALES_URL, token: effectiveToken }) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <div className="empty-title">Loading…</div>
                  <div className="empty-sub">Branch Supply History component not loaded yet.</div>
                </div>
              </div>
            ))
          ) : view === 'branch-expense' ? (
            (window.BranchNewExpense ? React.createElement(window.BranchNewExpense, { salesUrl: SALES_URL, token: effectiveToken }) : (
              <div className="card"><div className="empty-state"><div className="empty-icon">💸</div><div className="empty-title">Loading…</div></div></div>
            ))
          ) : view === 'sales-track' ? (
            (window.SalesTrack ? React.createElement(window.SalesTrack, { salesUrl: SALES_URL, token: effectiveToken }) : (
              <div className="card"><div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">Loading…</div></div></div>
            ))
          ) : view === 'product-sales' ? (
            (window.ProductSales ? React.createElement(window.ProductSales, { salesUrl: SALES_URL, token: effectiveToken }) : (
              <div className="card"><div className="empty-state"><div className="empty-icon">🛍️</div><div className="empty-title">Loading…</div></div></div>
            ))
          ) : (
            view === 'instock' && branchUser ? (
              <BranchInStock salesUrl={SALES_URL} token={effectiveToken} />
            ) : (
              <InStockView salesUrl={SALES_URL} token={effectiveToken} />
            )
          )}

        </div>
      </div>
    </div>
  );
}

// Inline CreateBranch uses branchLimit from props and displays it
function CreateBranch({ salesUrl, token, planId, branchLimit = 0 }) {
  const [form, setForm] = React.useState({
    name: '', address: '', phoneNumber: '', email: '', password: '', confirmPassword: ''
  });
  const [rows, setRows] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const onChange = (e) => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); };

  const loadBranches = async () => {
    try {
      setError('');
      const res = await fetch(salesUrl + '/api/branches', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load branches');
      setRows(Array.isArray(data.branches) ? data.branches : []);
      setPage(1);
    } catch (e) { setError(e.message); }
  };

  React.useEffect(() => { loadBranches(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (rows.length >= branchLimit) return setError('Branch limit reached for your plan');
    setSaving(true);
    try {
      const res = await fetch(salesUrl + '/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          phoneNumber: form.phoneNumber,
          email: form.email,
          password: form.password
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');
      setForm({ name: '', address: '', phoneNumber: '', email: '', password: '', confirmPassword: '' });
      await loadBranches();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  // pagination
  const total = rows.length;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visible = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <div>
     <div className="stats-row">
       <div className="stat-card">
         <div className="stat-label">Account Branch Limit</div>
         <div className="stat-value">{Number.isFinite(branchLimit) ? branchLimit : 0}</div>
       </div>
       <div className="stat-card">
         <div className="stat-label">Branches Used</div>
         <div className="stat-value">{rows.length}</div>
       </div>
     </div>
      <div className="card">
        <form onSubmit={submit}>
          <div className="row">
            <div className="col">
              <label>Branch Name</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="Branch name" />
            </div>
            <div className="col">
              <label>Address</label>
              <input name="address" value={form.address} onChange={onChange} placeholder="Address" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <label>Phone Number</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="Phone" />
            </div>
            <div className="col">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" />
            </div>
            <div className="col">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Confirm password" />
            </div>
          </div>
          <div className="row mt-3">
            <button className="btn" type="submit" disabled={saving || rows.length >= branchLimit}>{saving ? 'Saving…' : 'Create'}</button>
            <div className="ml-2" style={{alignSelf:'center'}}>
             {branchLimit > 0 ? `Limit: ${rows.length}/${branchLimit}` : 'Upgrade to enable branches'}
            </div>
          </div>
          {error ? <div className="mt-2 text-danger">{error}</div> : null}
        </form>
      </div>

      <div className="card mt-3 table-card">
        <div className="table-title">Branches</div>
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <div className="empty-title">No Branches Found</div>
            <div className="empty-sub">Create your first branch above. First branch is marked admin.</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="pretty-table">
              <thead>
                <tr>
                  <th style={{width:80}}>S.No</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={r._id || (startIndex + i)}>
                    <td><span className="serial-pill">{startIndex + i}</span></td>
                    <td><span className="cell-strong">{r.name || '-'}</span></td>
                    <td>{r.address || '-'}</td>
                    <td>{r.phoneNumber || '-'}</td>
                    <td>{r.email || '-'}</td>
                    <td>{r.isAdmin ? 'Yes' : 'No'}</td>
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

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<App />);
