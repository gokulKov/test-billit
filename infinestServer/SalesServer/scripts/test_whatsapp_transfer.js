require('dotenv').config();
const mongoose = require('mongoose');
const WhatsappController = require('../controllers/whatsappStockController');
const InStock = require('../models/inStock');
const WhatsappStock = require('../models/whatsappStock');

async function run() {
  const MONGO_URI = process.env.BILLIT_MONGO_URI || 'mongodb://127.0.0.1:27017/billit_db';
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to mongo');

  const productNo = 'b11';
  console.log('\nLooking up InStock item for productNo=', productNo);
  const centralDoc = await InStock.findOne({ 'items.productNo': productNo }).lean();
  if (!centralDoc) {
    console.log('No InStock doc found containing productNo', productNo);
    process.exit(1);
  }
  const idx = centralDoc.items.findIndex(it => String(it.productNo || '') === String(productNo));
  if (idx < 0) {
    console.log('No item index found'); process.exit(1);
  }
  console.log('Found InStock docId=', centralDoc._id.toString(), 'shop_id=', centralDoc.shop_id);
  console.log('Item before:', centralDoc.items[idx]);

  // Prepare mock req/res
  const mockReq = {
    user: { shop_id: String(centralDoc.shop_id), userId: 'test-run' },
    body: { productNo: productNo, supplyQty: 1 }
  };

  // remove any existing WhatsappStock for a clean create path
  try {
    await WhatsappStock.deleteOne({ shop_id: String(centralDoc.shop_id), productNo });
    console.log('Deleted existing WhatsappStock (if any)');
  } catch (e) { console.error('cleanup delete failed', e && e.message || e); }

  const mockRes = {
    status(code) { this._status = code; return this; },
    json(obj) { this._body = obj; console.log('Controller response status=', this._status || 200, 'body=', JSON.stringify(obj)); return obj; }
  };

  console.log('\nCalling createWhatsappStock to transfer 1 unit...');
  await WhatsappController.createWhatsappStock(mockReq, mockRes);

  // Re-read the InStock doc
  const afterDoc = await InStock.findById(centralDoc._id).lean();
  console.log('\nAfter update, item:', afterDoc.items[idx]);

  const ws = await WhatsappStock.findOne({ shop_id: String(centralDoc.shop_id), productNo: productNo }).lean();
  console.log('\nWhatsAppStock row:', ws);

  await mongoose.disconnect();
  console.log('\nDone');
}

run().catch(err => { console.error('test script error', err); process.exit(1); });
