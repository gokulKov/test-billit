import React, { useEffect, useState } from "react";

type Branch = { id: string; name: string; address?: string | null; phone?: string | null; email: string; createdAt: string };

export default function CreateBranch() {
  const headers = { "Content-Type": "application/json", "x-user-id": localStorage.getItem("uid") || "" };

  const [items, setItems] = useState<Branch[]>([]);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/branches", { headers });
    setItems(await res.json());
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setForm({ name: "", address: "", phone: "", email: "", password: "", confirmPassword: "" });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map(b => (
            <tr key={b.id}>
              <td style={{ padding: "6px 0" }}>{b.name}</td>
              <td>{b.address || "-"}</td>
              <td>{b.phone || "-"}</td>
              <td>{b.email}</td>
              <td>{new Date(b.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
