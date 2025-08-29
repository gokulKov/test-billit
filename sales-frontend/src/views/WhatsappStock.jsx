function WhatsappStock({ salesUrl, token }) {
  const [mode, setMode] = React.useState('price'); // 'price' or 'sell'

  const toggle = () => setMode(m => (m === 'price' ? 'sell' : 'price'));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div className="toggle-pill">
          <button className={mode === 'price' ? 'btn active' : 'btn'} onClick={() => setMode('price')}>Product Price</button>
          <button className={mode === 'sell' ? 'btn active' : 'btn'} onClick={() => setMode('sell')}>Product Sell</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        {mode === 'price' ? <div>hi this product price</div> : <div>hi this product sell</div>}
      </div>

      <div>
        {mode === 'price' ? (
          (window.ProductPrice ? React.createElement(window.ProductPrice, { salesUrl, token }) : <div className="card">Loading price...</div>)
        ) : (
          (window.ProductSell ? React.createElement(window.ProductSell, { salesUrl, token }) : <div className="card">Loading sell...</div>)
        )}
      </div>
    </div>
  );
}

window.WhatsappStock = WhatsappStock;
