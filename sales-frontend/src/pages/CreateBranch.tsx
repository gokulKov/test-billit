import React, { useEffect, useState } from "react";

type Branch = { _id?: string; id?: string; name: string; address?: string | null; phone?: string | null; email: string; createdAt?: string; isAdmin?: boolean };

export default function CreateBranch() {
  // Prefer the app's stored sales/branch tokens; fall back to legacy 'token'
  const rawToken = localStorage.getItem('branch_token') || localStorage.getItem('sales_token') || localStorage.getItem('token') || '';
  const headers: Record<string, string> = { "Content-Type": "application/json", "x-user-id": localStorage.getItem("uid") || "" };
  if (rawToken) headers.Authorization = `Bearer ${rawToken}`;

  const [items, setItems] = useState<Branch[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/branches", { headers });
    const data = await res.json();
    // API shape: { success: true, branches: [...] }
    if (Array.isArray(data)) {
      setItems(data as Branch[]);
    } else if (Array.isArray(data.branches)) {
      setItems(data.branches as Branch[]);
    } else if (Array.isArray((data as any).items)) {
      setItems((data as any).items as Branch[]);
    } else {
      // fallback: try to coerce to an empty array
      setItems([]);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        phoneNumber: form.phone,
        email: form.email,
        password: form.password
      };
      const res = await fetch("/api/branches", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Failed to create branch");
      setForm({ name: "", address: "", phone: "", email: "", password: "", confirmPassword: "" });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (branchId?: string) => {
    if (!branchId) return;
    try {
      setTogglingId(branchId);
      const res = await fetch(`/api/branches/${branchId}/toggle-admin`, { method: 'PATCH', headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Toggle failed');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Create Branch</h2>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
        <input placeholder="Branch name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <input placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Confirm password" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
        <button disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Branches</h3>
      {/* Simple table (align with your stock UI styles if available) */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Name</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Address</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Phone</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Email</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Admin</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map(b => (
            <tr key={b._id || b.id}>
              <td style={{ padding: "6px 0" }}>{b.name}</td>
              <td>{b.address || "-"}</td>
              <td>{b.phone || "-"}</td>
              <td>{b.email}</td>
              <td>{b.isAdmin ? 'Yes' : 'No'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {b.createdAt ? new Date(b.createdAt).toLocaleString() : '-'}
                <div style={{ marginTop: 6 }}>
                  <button disabled={togglingId === (b._id || b.id)} onClick={() => toggleAdmin(b._id || b.id)}>
                    {togglingId === (b._id || b.id) ? 'Changing…' : 'Change'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
