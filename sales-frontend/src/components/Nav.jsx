function Nav() {
	const [branchLimit, setBranchLimit] = React.useState(0);
	const [used, setUsed] = React.useState(0);
	const [loading, setLoading] = React.useState(true);

	const SALES_URL = window.ENV_CONFIG?.SALES_API_URL || 'http://127.0.0.1:9000';

	const getToken = () => localStorage.getItem('sales_token') || '';
	const getPreferredToken = () => localStorage.getItem('branch_token') || localStorage.getItem('sales_token') || '';

	React.useEffect(() => {
		let mounted = true;
		const tk = getPreferredToken();
		if (!tk) { setLoading(false); return; }

		const decode = (t) => {
			try {
				const b = t.split('.')[1];
				return JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')));
			} catch { return null; }
		};

		const load = async () => {
			try {
				const decoded = decode(tk);
				if (decoded && Number.isFinite(decoded.branchLimit)) {
					if (mounted) setBranchLimit(Number(decoded.branchLimit));
				} else {
					// fallback to verify endpoint
					const v = await fetch(SALES_URL + '/auth/verify', { headers: { Authorization: 'Bearer ' + tk } });
					const data = await v.json();
					if (v.ok && (data.payload || data.decoded)) {
						const p = data.payload || data.decoded;
						if (mounted && Number.isFinite(p.branchLimit)) setBranchLimit(Number(p.branchLimit));
					}
				}

				// fetch branches to compute used count
				const res = await fetch(SALES_URL + '/api/branches', { headers: { Authorization: 'Bearer ' + tk } });
				const json = await res.json();
				if (res.ok && Array.isArray(json.branches) && mounted) setUsed(json.branches.length);
			} catch (err) {
				// ignore
			} finally { if (mounted) setLoading(false); }
		};

		load();
		return () => { mounted = false; };
	}, []);

	return (
		<div className="nav-header">
			<div className="nav-left">Fixel Sales</div>
			<div className="nav-right">
				{loading ? <span>Loading…</span> : (
					<span>Branches: {used}/{Number.isFinite(branchLimit) ? branchLimit : 0}</span>
				)}
			</div>
		</div>
	);
}

// Register globally for the in-browser JSX loader
window.Nav = Nav;
