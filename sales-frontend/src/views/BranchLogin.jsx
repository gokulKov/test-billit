function BranchLogin({ salesUrl }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const res = await fetch(salesUrl + '/auth/branch-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
      // show welcome message
      setMessage(`Welcome, ${data.payload?.name || 'Branch user'}!`);
      // optionally store branch token
      // Remove any sales token to avoid both tokens co-existing in the same browser
      try { localStorage.removeItem('sales_token'); } catch (__) {}
      localStorage.setItem('branch_token', data.token);
      // Notify the app in the same tab that a branch login happened
      try { window.dispatchEvent(new Event('branch-login')); } catch (__) {}
      // Navigate to branch dashboard
      try { location.hash = '#branch'; } catch (__) {}
    } catch (err) {
      setMessage(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="card auth-card">
      <h3>Branch Login</h3>
      <form onSubmit={submit}>
        <div className="mt-2">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="mt-2">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="row mt-3">
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>
      {message && <div className="mt-2">{message}</div>}
    </div>
  );
}
// Register as global for in-browser JSX loader
window.BranchLogin = BranchLogin;
