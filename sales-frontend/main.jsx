function Sidebar({ active = 'create' }) {
  const Item = ({ id, label, icon = '•', locked = false, activeId }) => (
    <a className={'nav-item ' + (activeId === id ? 'active' : '')} href="#">
      <span className="icon">{icon}</span>
      <span>{label}</span>
      {locked ? <span className="lock">🔒</span> : null}
    </a>
  );
  return (
    <aside className="sidebar">
      <div className="brand">Fixel</div>
      <nav className="nav">
        <Item id="create" label="Create" icon={"＋"} activeId={active} />
        <Item id="records" label="All Records" icon={"🗄️"} activeId={active} />
        <Item id="mobile" label="Mobile Registry" icon={"📱"} activeId={active} />
        <Item id="balance" label="Balance Summary" icon={"📑"} activeId={active} />
        <Item id="stock" label="Manage Stock" icon={"📦"} locked activeId={active} />
        <Item id="expenses" label="Expenses" icon={"💵"} locked activeId={active} />
      </nav>
    </aside>
  );
}

function HeaderBar() {
  return (
    <header className="header">
      <div>
        <h1>Create New Record</h1>
        <small>Add customer or dealer records with mobile entries</small>
      </div>
    </header>
  );
}

function App() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [token, setToken] = React.useState(localStorage.getItem('sales_token') || '');
  const [hasAccess, setHasAccess] = React.useState(null); // null=unknown, true/false
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const SALES_URL = 'http://127.0.0.1:9000';

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
  localStorage.setItem('sales_token', data.token);
  setToken(data.token);
  setHasAccess(true);
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
      // Verify Sales JWT with SalesServer
      const res = await fetch(SALES_URL + '/auth/verify', {
        headers: { Authorization: 'Bearer ' + tk }
      });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.message || 'Token invalid');
      setHasAccess(true);
    } catch (err) {
      setError(err.message);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Clean up any old generic token key to avoid using wrong JWT
    if (localStorage.getItem('token') && !localStorage.getItem('sales_token')) {
      localStorage.removeItem('token');
    }
    if (token && hasAccess === null) {
      checkAccess(token);
    }
  }, []);

  if (loading && hasAccess === null) return <div>Loading…</div>;

  if (!token || hasAccess === false) {
    return (
      <div className="auth">
        <h2 style={{marginTop:0}}>Sales Login</h2>
        <form onSubmit={login}>
          <div className="mt-2">
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
          </div>
          <div className="mt-2">
            <label>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
          </div>
          <div className="row mt-3">
            <button className="btn" disabled={loading} type="submit">{loading? 'Please wait…' : 'Login'}</button>
            {token ? <button className="btn secondary" onClick={(e)=>{e.preventDefault();checkAccess();}}>Verify token</button> : null}
          </div>
        </form>
        {error && <div className="mt-2 text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar active="create" />
      <div className="main">
        <HeaderBar />
        <div className="content">
          {/* <div className="card">
            <div style={{fontSize:14, color:'#9ca3af', marginBottom:8}}>JWT payload</div>
            <pre style={{margin:0, whiteSpace:'pre-wrap'}}>{(() => {
              try {
                const parts = token.split('.')[1];
                return JSON.stringify(JSON.parse(atob(parts)), null, 2);
              } catch { return '—'; }
            })()}</pre>
          </div> */}
        </div>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<App />);
