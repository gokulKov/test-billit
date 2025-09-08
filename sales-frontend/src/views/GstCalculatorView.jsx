function GstCalculatorView() {
  const [transactions, setTransactions] = React.useState([]);
  
  React.useEffect(() => {
    const salesUrl = window.SALES_URL || 'http://127.0.0.1:9000';
    const token = localStorage.getItem('sales_token') || '';
    fetch(salesUrl + '/api/in-stock?gstOnly=1', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
      .then(function(res) {
        if (!res.ok) return Promise.resolve({ entries: [] });
        return res.json();
      })
      .then(function(data) {
        if (Array.isArray(data.entries)) {
          setTransactions(data.entries.map(function(e) {
            return {
              supplierName: (e.supplier_id && (e.supplier_id.supplierName || e.supplier_id.agencyName)) || '-',
              bankName: (e.bank_id && (e.bank_id.bankName || e.bank_id.accountNumber)) || '-',
              supplierAmount: e.supplierAmount,
              gstAmount: e.gstAmount,
              createdAt: e.createdAt
            };
          }));
        }
      });
  }, []);
  
  return React.createElement(window.FeatureGuard, {
    featureKey: 'gst_calculator_enabled',
    featureName: 'GST Calculator',
    requiredPlans: 'Gold/Premium'
  }, React.createElement(window.GstCalculator, { transactions }));
}

window.GstCalculatorView = GstCalculatorView;
