function SecondsSales({ salesUrl, token }) {
  const [form, setForm] = React.useState({
    mobileName: '', model: '', imeNo: '', specification: '', mobileCondition: '', colour: '', sellerName: '', sellerAddress: '', referenceName: '', referenceNumber: '', reasonForSale: '', proofType: '', proofNo: '', valueOfProduct: '', paymentMethod: ''
  });
  const [images, setImages] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [signatures, setSignatures] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [entries, setEntries] = React.useState([]);
  const [banks, setBanks] = React.useState([]);
  const [selectedBankId, setSelectedBankId] = React.useState('');
  const [selectedBankBalance, setSelectedBankBalance] = React.useState(0);
  const [mobileNameFilter, setMobileNameFilter] = React.useState('');
  const [modelFilter, setModelFilter] = React.useState('');

  async function loadEntries() {
    try {
      const res = await fetch((salesUrl || '') + '/api/seconds-sales', { headers: { Authorization: token ? ('Bearer ' + token) : '' } });
      console.log("sales",res);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setEntries(Array.isArray(data.rows) ? data.rows : []);
    } catch (err) {
      console.error('loadEntries error', err);
    }
  }

  React.useEffect(() => { loadEntries(); }, []);
  React.useEffect(() => { loadBanks(); }, []);

  async function loadBanks() {
    try {
      const res = await fetch((salesUrl || '') + '/api/banks', { headers: { Authorization: token ? ('Bearer ' + token) : '' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load banks');
      setBanks(Array.isArray(data.banks) ? data.banks : []);
    } catch (err) { console.error('loadBanks error', err); }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(e, setter) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoading(true);
    try {
      const arr = await Promise.all(files.map(async f => ({ name: f.name, base64: await toBase64(f) })));
      setter(prev => [...prev, ...arr]);
    } catch (err) {
      console.error(err);
      setError('Failed to read files');
    } finally { setLoading(false); }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
  const payload = { ...form, images, documents, signatures, bank_id: form.paymentMethod || '' };
      const res = await fetch((salesUrl || '') + '/api/seconds-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? ('Bearer ' + token) : '' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Save failed');
      setSuccess('Saved successfully');
      setForm({ mobileName: '', model: '', imeNo: '', specification: '', mobileCondition: '', colour: '', sellerName: '', sellerAddress: '', referenceName: '', referenceNumber: '', reasonForSale: '', proofType: '', proofNo: '', valueOfProduct: '', paymentMethod: '' });
  setImages([]); setDocuments([]); setSignatures([]);
  await loadEntries();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally { setLoading(false); }
  }

  // Filtering logic for entries
  const filteredEntries = React.useMemo(() => {
    return entries.filter(r => {
      return (
        (!mobileNameFilter || (r.mobileName || '').toLowerCase().includes(mobileNameFilter.toLowerCase())) &&
        (!modelFilter || (r.model || '').toLowerCase().includes(modelFilter.toLowerCase()))
      );
    });
  }, [entries, mobileNameFilter, modelFilter]);

  // Helper to check if a mobile is sold
  function isSold(entry) {
    return Array.isArray(entry.purchases) && entry.purchases.length > 0;
  }

  // Sort: unsold first, sold last
  const sortedEntries = [
    ...filteredEntries.filter(e => !isSold(e)),
    ...filteredEntries.filter(e => isSold(e))
  ];

  return (
    <div>
      <div className="card">
        <h3>Seconds Sales - Create Entry</h3>
        <form onSubmit={submit}>
          <div className="row">
            <div className="col">
              <label>Mobile Name</label>
              <input name="mobileName" value={form.mobileName} onChange={onChange} />
            </div>
            <div className="col">
              <label>Model</label>
              <input name="model" value={form.model} onChange={onChange} />
            </div>
             <div className="col">
              <label>IME No</label>
              <input name="imeNo" value={form.imeNo} onChange={onChange} />
            </div>
            <div className="col">
              <label>Specification</label>
              <input name="specification" value={form.specification} onChange={onChange} />
            </div>
             <div className="col">
              <label>Mobile Condition</label>
              <input name="mobileCondition" value={form.mobileCondition} onChange={onChange} />
            </div>
            <div className="col">
              <label>Colour</label>
              <input name="colour" value={form.colour} onChange={onChange} />
            </div>
          </div>

          <div className="row mt-2">
            <div className="col">
              <label>Seller Name</label>
              <input name="sellerName" value={form.sellerName} onChange={onChange} />
            </div>
            <div className="col">
              <label>Seller Address</label>
              <input name="sellerAddress" value={form.sellerAddress} onChange={onChange} />
            </div>
             <div className="col">
              <label>Reference Name</label>
              <input name="referenceName" value={form.referenceName} onChange={onChange} />
            </div>
            <div className="col">
              <label>Reference Number</label>
              <input name="referenceNumber" value={form.referenceNumber} onChange={onChange} />
            </div>
             <div className="col">
              <label>Reason for Sale</label>
              <input name="reasonForSale" value={form.reasonForSale} onChange={onChange} />
            </div>
            <div className="col">
              <label>Proof Type</label>
              <input name="proofType" value={form.proofType} onChange={onChange} />
            </div>
          </div>


          <div className="row mt-2">
            <div className="col">
              <label>Proof No</label>
              <input name="proofNo" value={form.proofNo} onChange={onChange} />
            </div>
            <div className="col">
              <label>Price</label>
              <input name="valueOfProduct" value={form.valueOfProduct} onChange={onChange} />
            </div>
              <div className="col">
                      <label>Payment Method (Bank)</label>
                      <select name="paymentMethod" value={form.paymentMethod} onChange={onChange}>
                        <option value="">Select bank</option>
                        {banks.map(b => <option key={b._id} value={b._id}>{b.bankName} — {Number(b.accountBalance||0).toFixed(2)}</option>)}
                      </select>
                      {form.paymentMethod ? <div style={{fontSize:12,marginTop:6}}>Selected balance: {Number((banks.find(x=>x._id===form.paymentMethod)||{}).accountBalance||0).toFixed(2)}</div> : null}
                    </div>
          </div>

          <div className="row mt-2">
                  
            <div className="col">
              <label>Images (photos)</label>
              <input type="file" accept="image/*" multiple onChange={e => handleFiles(e, setImages)} />
            </div>
             <div className="col">
              <label>Documents (proof)</label>
              <input type="file" accept="application/pdf,image/*" multiple onChange={e => handleFiles(e, setDocuments)} />
            </div>
            <div className="col">
              <label>Signatures (customer/shop)</label>
              <input type="file" accept="image/*" multiple onChange={e => handleFiles(e, setSignatures)} />
            </div>
          </div>

          <div className="row mt-2">
           
            
          </div>

          <div className="row mt-3">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
            <button className="btn secondary" type="button" style={{marginLeft:8}} onClick={() => { setForm({ mobileName: '', model: '', imeNo: '', specification: '', mobileCondition: '', colour: '', sellerName: '', sellerAddress: '', referenceName: '', referenceNumber: '', reasonForSale: '', proofType: '', proofNo: '', valueOfProduct: '', paymentMethod: '' }); setImages([]); setDocuments([]); setSignatures([]); }}>Reset</button>
          </div>

          {error ? <div className="mt-2 text-danger">{error}</div> : null}
          {success ? <div className="mt-2 text-success">{success}</div> : null}
        </form>
      </div>

      {/* <div className="card mt-3 table-card">
  <div className="table-title">Selected Files</div>
        <div style={{padding:12}}>
          <div>
            <strong>Images:</strong>
            <ul>{images.map((f,i) => <li key={i}>{f.name}</li>)}</ul>
          </div>
          <div>
            <strong>Documents:</strong>
            <ul>{documents.map((f,i) => <li key={i}>{f.name}</li>)}</ul>
          </div>
          <div>
            <strong>Signatures:</strong>
            <ul>{signatures.map((f,i) => <li key={i}>{f.name}</li>)}</ul>
          </div>
        </div>
      </div> */}

      <div className="card mt-3 table-card">
        <div className="table-title">Saved Entries</div>
        {/* Filter Section */}
        <div className="filter-section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input type="text" placeholder="Filter by Mobile Name" value={mobileNameFilter} onChange={e => setMobileNameFilter(e.target.value)} style={{ padding: '8px', width: '160px' }} />
          <input type="text" placeholder="Filter by Model" value={modelFilter} onChange={e => setModelFilter(e.target.value)} style={{ padding: '8px', width: '160px' }} />
        </div>
        <div className="table-scroll">
          <table className="modern-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Mobile Name</th>
                <th>Model</th>
                <th>IME No</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Files</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((r, i) => (
                <tr key={r._id || i} style={isSold(r) ? { backgroundColor: '#ffe5e5', color: 'red', cursor: 'pointer' } : { cursor: 'pointer' }} onClick={() => { try { location.hash = '#seconds-sales-view-' + (r._id || i); } catch {} }}>
                  <td><span className="serial-badge">{i + 1}</span></td>
                  <td>{r.mobileName || '-'}</td>
                  <td>{r.model || '-'}</td>
                  <td>{r.imeNo || '-'}</td>
                  <td>{r.sellerName || '-'}</td>
                  <td>{Number(r.valueOfProduct || 0).toFixed(2)}</td>
                  <td>{((r.images || []).length + (r.documents || []).length + (r.signatures || []).length) || 0}</td>
                  <td>{new Date(r.createdAt || Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.SecondsSales = SecondsSales;
