function CreateBranch({ salesUrl, token, planId }) {
  const [form, setForm] = React.useState({
    name: '', address: '', phoneNumber: '', email: '', password: '', confirmPassword: ''
  });
  const [rows, setRows] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [togglingId, setTogglingId] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const PLAN_LIMITS = { 'sales-basic': 0, 'sales-gold': 3, 'sales-premium': 10 };
  const branchLimit = PLAN_LIMITS[planId] ?? 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

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
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (rows.length >= branchLimit) {
      setError('Branch limit reached for your plan');
      return;
    }
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

  const toggleAdmin = async (branchId) => {
    try {
      console.log('toggleAdmin clicked', branchId);
      setError('');
      setTogglingId(branchId);
      const res = await fetch(`${salesUrl}/api/branches/${branchId}/toggle-admin`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Toggle failed');
      // refresh the list
      await loadBranches();
    } catch (e) {
      console.error('toggleAdmin error', e);
      setError(e.message || 'Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  // pagination
  const total = rows.length;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visible = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <div>
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
            <button className="btn" type="submit" disabled={saving || rows.length >= branchLimit}>
              {saving ? 'Saving…' : 'Create'}
            </button>
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
            <div className="empty-sub">Create your first branch above. First branch will be marked admin.</div>
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
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span>{r.isAdmin ? 'Yes' : 'No'}</span>
                        <button className="btn secondary" type="button" aria-label={`Change admin for ${r.name || r._id}`} disabled={togglingId === r._id} onClick={() => toggleAdmin(r._id)}>
                          {togglingId === r._id ? 'Changing…' : 'Change'}
                        </button>
                      </div>
                    </td>
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
