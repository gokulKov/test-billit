
const React = window.React;



function GstCalculator(props) {
  const transactions = props.transactions || [];
  const totalGst = transactions.reduce((sum, t) => sum + (Number(t.gstAmount) || 0), 0);

  return (
    <div className="gst-calculator-page" style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>GST Calculator</h2>
      <div
        className="gst-total-box"
        style={{
          marginBottom: 24,
          fontWeight: 600,
          fontSize: 18,
          background: '#f3f6fa',
          padding: '12px 20px',
          borderRadius: 8,
          display: 'inline-block',
        }}
      >
        Total GST Amount: <span style={{ color: '#2563eb' }}>{totalGst}</span>
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          padding: 0,
          border: '1px solid #e5e7eb',
        }}
      >
        <table
          className="gst-table"
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 15,
          }}
        >
          <thead>
            <tr style={{ background: '#f3f6fa' }}>
              <th style={{ fontWeight: 600, padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Supplier</th>
              <th style={{ fontWeight: 600, padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Bank</th>
              <th style={{ fontWeight: 600, padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Supplier Amount</th>
              <th style={{ fontWeight: 600, padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>GST Amount</th>
              <th style={{ fontWeight: 600, padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr
                key={idx}
                style={{
                  background: idx % 2 === 0 ? '#fff' : '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <td style={{ padding: '10px 8px' }}>{t.supplierName || '-'}</td>
                <td style={{ padding: '10px 8px' }}>{t.bankName || '-'}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{t.supplierAmount}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{t.gstAmount}</td>
                <td style={{ padding: '10px 8px' }}>{t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


window.GstCalculator = GstCalculator;
