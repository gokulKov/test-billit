function SecondsSalesView({ salesUrl, token, id }) {
  const [entry, setEntry] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch((salesUrl || '') + '/api/seconds-sales', { headers: { Authorization: token ? ('Bearer ' + token) : '' } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load');
        const found = (data.rows || []).find(r => String(r._id) === String(id));
        if (mounted) setEntry(found || null);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed');
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // Purchase modal state (hooks before returns)
  const [showPurchase, setShowPurchase] = React.useState(false);
  const [purchaseForm, setPurchaseForm] = React.useState({ customerName: '', phone: '', price: '', bankId: '' });
  const [purchaseImages, setPurchaseImages] = React.useState([]);
  const [purchaseDocs, setPurchaseDocs] = React.useState([]);
  const [banks, setBanks] = React.useState([]);
  const [purchaseLoading, setPurchaseLoading] = React.useState(false);

  // load banks
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch((salesUrl || '') + '/api/banks', { headers: { Authorization: token ? ('Bearer ' + token) : '' } });
        const data = await res.json();
        if (res.ok && mounted) setBanks(Array.isArray(data.banks) ? data.banks : []);
      } catch (err) { console.error('load banks', err); }
    })();
    return () => { mounted = false; };
  }, []);

  function purchaseOnChange(e) {
    const { name, value } = e.target;
    setPurchaseForm(f => ({ ...f, [name]: value }));
  }

  function filesToBase64(fileList, setter) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const promises = files.map(f => new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res({ name: f.name, base64: reader.result });
      reader.onerror = rej;
      reader.readAsDataURL(f);
    }));
    Promise.all(promises).then(arr => setter(prev => [...prev, ...arr])).catch(err => console.error('file read', err));
  }

  async function submitPurchase(e) {
    e.preventDefault();
    const amount = Number(purchaseForm.price || 0);
    const bankId = purchaseForm.bankId || '';
    if (!amount || amount <= 0) return alert('Enter valid price');
    setPurchaseLoading(true);
    try {
      const payload = {
        customerName: purchaseForm.customerName || '',
        phone: purchaseForm.phone || '',
        price: amount,
        bank_id: bankId || undefined,
        images: purchaseImages || [],
        documents: purchaseDocs || []
      };
      const res = await fetch((salesUrl || '') + '/api/seconds-sales/' + encodeURIComponent(entry._id) + '/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? ('Bearer ' + token) : '' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Purchase API failed');
      // server returns updated entry (with purchases)
      if (data.entry) setEntry(data.entry);
      setShowPurchase(false);
      setPurchaseForm({ customerName: '', phone: '', price: '', bankId: '' });
      setPurchaseImages([]); setPurchaseDocs([]);
    } catch (err) {
      alert(err.message || 'Purchase failed');
    } finally { setPurchaseLoading(false); }
  }

  // Helpers to prepare WhatsApp message and printable bill
  function decodeJwt(tk) {
    try {
      const theToken = tk || token || localStorage.getItem('branch_token') || localStorage.getItem('sales_token') || '';
      const parts = theToken.split('.');
      if (parts.length < 2) return {};
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(function(c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join(''));
      return JSON.parse(json);
    } catch (e) { return {}; }
  }

  async function getBranchInfo() {
    let shopName = '';
    let shopContact = '';
    try {
      const url = new URL((salesUrl || '') + '/api/branches');
      const res = await fetch(url, { headers: { Authorization: token ? ('Bearer ' + token) : '' } });
      const data = await res.json();
      if (res.ok && Array.isArray(data.branches) && data.branches.length > 0) {
        const payload = decodeJwt();
        const branchId = payload?.branch_id || payload?._id || '';
        let found = null;
        if (branchId) found = data.branches.find(b => String(b._id) === String(branchId));
        if (!found) found = data.branches[0];
        shopName = found?.name || '';
        shopContact = found?.phoneNumber || found?.phone || '';
      }
    } catch (e) { /* ignore */ }
    if (!shopName || !shopContact) {
      const payload = decodeJwt();
      shopName = shopName || payload.shopName || payload.name || payload.branchName || '';
      shopContact = shopContact || payload.phone || payload.phoneNumber || payload.branchPhone || '';
    }
    return { shopName, shopContact };
  }

  function normalizePhone(raw) {
    let digits = (raw || '').toString().replace(/[^0-9]/g, '');
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10) digits = '91' + digits;
    return digits;
  }

  async function handleWhatsAppLastPurchase() {
    const p = (entry.purchases || [])[((entry.purchases||[]).length - 1)];
    if (!p) return alert('No purchase found');
    const { shopName, shopContact } = await getBranchInfo();
    const productName = `${entry.mobileName || ''}${entry.model ? (' — ' + entry.model) : ''}`.trim();
    const date = new Date(p.createdAt || Date.now()).toLocaleString();
    const message = `Shop: ${shopName}\nContact: ${shopContact}\n\nProduct: ${productName}\nPrice: ₹ ${Number(p.price||0).toFixed(2)}\nDate: ${date}\nCustomer: ${p.customerName || '-'} — ${p.phone || '-'}\n\nThanks,\n${shopName}`;
    const cust = normalizePhone(p.phone || '');
    try {
      // Open WhatsApp web with prefilled message to customer number
      if (cust) window.open(`https://web.whatsapp.com/send?phone=${cust}&text=${encodeURIComponent(message)}`, '_blank');
      else window.open('https://web.whatsapp.com/', '_blank');
    } catch (e) { console.error('open whatsapp', e); }
  }

  function handlePrintLastPurchase() {
    const p = (entry.purchases || [])[((entry.purchases||[]).length - 1)];
    if (!p) return alert('No purchase found');
    (async () => {
      const { shopName, shopContact } = await getBranchInfo();
      const productName = `${entry.mobileName || ''}${entry.model ? (' — ' + entry.model) : ''}`.trim();
      const date = new Date(p.createdAt || Date.now()).toLocaleString();
      const total = Number(p.price || 0).toFixed(2);
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style> @page { size: 72mm auto; margin: 2mm; } body{font-family:monospace,Arial,Helvetica,sans-serif;padding:6px;color:#111; width:72mm; box-sizing:border-box;} h2{margin:0 0 6px;font-size:14px} .shop{ text-align:center; margin-bottom:6px; } .shop strong{ display:block; font-size:12px } .shop .contact{ font-size:11px; margin-top:2px } .date{ font-size:11px; margin-bottom:6px } table{width:100%;border-collapse:collapse;margin-top:6px;font-size:11px} th,td{padding:4px 2px} thead th{border-bottom:1px dashed #bbb; text-align:left; font-size:11px} tbody td{border-bottom:1px dashed #eee} .right{ text-align:right } footer{margin-top:8px;text-align:right;font-weight:700;font-size:12px} .center{ text-align:center }</style></head><body>` +
        `<div class="center"><h2 style="margin:0">TAX INVOICE</h2></div><div class="shop"><strong>${shopName || 'Shop'}</strong><div class="contact">${shopContact || ''}</div></div>` +
        `<div class="date"><strong>Date:</strong> ${date}</div>` +
        `<table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Unit</th><th class="right">Line</th></tr></thead><tbody>` +
        `<tr><td style="padding:6px">${productName}</td><td style="text-align:right;padding:6px">1</td><td style="text-align:right;padding:6px">${Number(p.price||0).toFixed(2)}</td><td style="text-align:right;padding:6px">${Number(p.price||0).toFixed(2)}</td></tr>` +
        `</tbody></table>` +
        `<footer>Total: ${total}</footer><div style="margin-top:8px">Thanks for your purchase!</div></body></html>`;
      const w = window.open('', '_blank');
      if (!w) {
        setError('Popup blocked: allow popups to print directly');
        return;
      }
      w.document.open(); w.document.write(html); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch (e) { /* ignore */ } }, 300);
    })();
  }

  if (loading) return <div className="card">Loading…</div>;
  if (error) return <div className="card text-danger">{error}</div>;
  if (!entry) return <div className="card">Entry not found</div>;

  // Helper to render file links for all file types (including PDF)
  const fileLinks = (arr) => (arr || []).map((f, i) => {
    const filename = f.filename || (f.path ? f.path.split(/[\\/]/).pop() : null);
    const base = (salesUrl || '').replace(/\/+$/, '') || '';
    // If file is PDF, ensure correct URL and open in new tab
    const url = filename ? `${base}/uploads/seconds-sales/${filename}` : (f.path || '#');
    const isPdf = (filename || '').toLowerCase().endsWith('.pdf');
    return (
      <div key={i}>
        <a href={url} target="_blank" rel="noreferrer" type={isPdf ? 'application/pdf' : undefined}>
          {f.originalName || filename || 'file'}
        </a>
      </div>
    );
  });

  // Helper to render file links for purchases
  const purchaseFileLinks = fileLinks;

  return (
    <div>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{margin:0}}>Seconds Sales — {entry.mobileName || 'Details'}</h3>
          <div>
            <button className="btn" onClick={() => { try { location.hash = '#seconds-sales'; } catch {} }}>Back</button>
            <button className="btn" style={{marginLeft:8}} onClick={() => setShowPurchase(true)}>Purchase</button>
          </div>
        </div>

        <div style={{marginTop:16}}>
          <div className="row" style={{gap:16}}>
            <div className="col" style={{minWidth:220}}><div className="label">Model</div><div className="value">{entry.model || '-'}</div></div>
            <div className="col" style={{minWidth:220}}><div className="label">IME No</div><div className="value">{entry.imeNo || '-'}</div></div>
          </div>

          <div className="row mt-2" style={{gap:16}}>
            <div className="col" style={{minWidth:220}}><div className="label">Specification</div><div className="value">{entry.specification || '-'}</div></div>
            <div className="col" style={{minWidth:220}}><div className="label">Condition</div><div className="value">{entry.mobileCondition || '-'}</div></div>
          </div>

          <div className="row mt-2" style={{gap:16}}>
            <div className="col" style={{minWidth:220}}><div className="label">Seller</div><div className="value">{entry.sellerName || '-'}</div></div>
            <div className="col" style={{minWidth:220}}><div className="label">Seller Address</div><div className="value">{entry.sellerAddress || '-'}</div></div>
          </div>

          <div className="row mt-2" style={{gap:16}}>
            <div className="col" style={{minWidth:220}}><div className="label">Reference</div><div className="value">{(entry.referenceName || '-') + (entry.referenceNumber ? (' — ' + entry.referenceNumber) : '')}</div></div>
            <div className="col" style={{minWidth:220}}><div className="label">Reason</div><div className="value">{entry.reasonForSale || '-'}</div></div>
          </div>

          <div className="row mt-2" style={{gap:16}}>
            <div className="col" style={{minWidth:220}}><div className="label">Proof</div><div className="value">{(entry.proofType || '-') + (entry.proofNo ? (' — ' + entry.proofNo) : '')}</div></div>
            <div className="col" style={{minWidth:220}}><div className="label">Value</div><div className="value">{Number(entry.valueOfProduct || 0).toFixed(2)}</div></div>
          </div>

          <div className="mt-3"><div className="label">Images</div><div className="value">{fileLinks(entry.images)}</div></div>
          <div className="mt-3"><div className="label">Documents</div><div className="value">{fileLinks(entry.documents)}</div></div>
          <div className="mt-3"><div className="label">Signatures</div><div className="value">{fileLinks(entry.signatures)}</div></div>
        </div>
      </div>

      {/* Purchases box */}
      <div className="card mt-3">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:600}}>Purchases</div>
          <div>{(entry.purchases || []).length} records</div>
        </div>
        <div style={{marginTop:12}}>
          {(entry.purchases || []).length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧾</div><div className="empty-title">No purchases added</div></div>
          ) : (
            (entry.purchases || []).map((p, idx) => (
              <div key={idx} style={{border:'1px solid #eee', padding:8, marginBottom:8, backgroundColor:'#ffe5e5', color:'red'}}>
                <div><strong>{p.customerName || '-'}</strong> — {p.phone || '-'}</div>
                <div>Price: ₹ {Number(p.price || 0).toFixed(2)}</div>
                <div style={{marginTop:6}}>{purchaseFileLinks(p.documents)}</div>
                <div style={{marginTop:6}}>{purchaseFileLinks(p.images)}</div>
              </div>
            ))
          )}
        </div>
        {(entry.purchases || []).length > 0 ? (
          <div style={{marginTop:12}}>
            <button className="btn" onClick={handleWhatsAppLastPurchase}>Whatsapp</button>
            <button className="btn secondary" style={{marginLeft:8}} onClick={handlePrintLastPurchase}>Next Bill</button>
          </div>
        ) : null}
      </div>

      {/* Purchase modal */}
      {showPurchase ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h4>Record Purchase</h4>
            <form onSubmit={submitPurchase}>
              <div className="row mt-2">
                <div className="col"><label>Customer name</label><input name="customerName" value={purchaseForm.customerName} onChange={purchaseOnChange} /></div>
                <div className="col"><label>Phone</label><input name="phone" value={purchaseForm.phone} onChange={purchaseOnChange} /></div>
              </div>
              <div className="row mt-2">
                <div className="col"><label>Price</label><input name="price" value={purchaseForm.price} onChange={purchaseOnChange} /></div>
                <div className="col">
                  <label>Payment (Bank)</label>
                  <select name="bankId" value={purchaseForm.bankId} onChange={purchaseOnChange} required>
                    <option value="">Select bank to credit</option>
                    {banks.map(b => <option key={b._id} value={b._id}>{b.bankName} — {Number(b.accountBalance||0).toFixed(2)}</option>)}
                  </select>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col"><label>Documents</label><input type="file" accept="application/pdf,image/*" multiple onChange={(e)=>filesToBase64(e.target.files, setPurchaseDocs)} /></div>
                <div className="col"><label>Photos</label><input type="file" accept="image/*" multiple onChange={(e)=>filesToBase64(e.target.files, setPurchaseImages)} /></div>
              </div>
              <div className="row mt-3">
                <button className="btn" type="submit" disabled={purchaseLoading}>{purchaseLoading ? 'Saving…' : 'Enter'}</button>
                <button className="btn secondary" type="button" style={{marginLeft:8}} onClick={() => setShowPurchase(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

window.SecondsSalesView = SecondsSalesView;
