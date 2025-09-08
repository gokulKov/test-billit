const mongoose = require('mongoose');
const Branch = require('../models/branch');
const InStock = require('../models/inStock');

// New model for branch stock and supply will be implemented using simple collections here
const BranchStock = mongoose.model('BranchStock', new mongoose.Schema({
  shop_id: { type: String, index: true },
  branch_id: { type: String, index: true },
  productId: { type: String },
  productNo: { type: String },
  productName: { type: String },
  brand: { type: String },
  model: { type: String },
  costPrice: { type: Number, default: 0 },
  qty: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  validity: { type: Date },
  updatedBy: { type: String }
}, { timestamps: true }));

const BranchSupply = mongoose.model('BranchSupply', new mongoose.Schema({
  shop_id: { type: String, index: true },
  branch_id: { type: String, index: true },
  items: { type: Array, default: [] }, // { productName, productId, qty, unitSellingPrice, value, costPrice, totalCostPrice }
  totalSupplyValue: { type: Number, default: 0 },
  totalSupplyCost: { type: Number, default: 0 },
  createdBy: { type: String },
}, { timestamps: true }));

// Helper to compute value: sellingPrice * qty
function computeItemValue(unitSellingPrice, qty) {
  const v = (Number(unitSellingPrice) || 0) * (Number(qty) || 0);
  return Number(Number(v).toFixed(2));
}

exports.createBranchSupply = async (req, res) => {
  try {
    const shop_id = req.user.shop_id;
    const branch_id = req.body.branch_id;
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!branch_id) return res.status(400).json({ success: false, message: 'branch_id required' });
    if (items.length === 0) return res.status(400).json({ success: false, message: 'items required' });

    // Prepare items with computed selling value and cost totals
    let total = 0;
    let totalCost = 0;
    const prepared = items.map(i => {
      const qty = Number(i.qty) || 0;
      const costUnit = Number(i.costPrice) || 0;
      const pct = (i.pct != null) ? Number(i.pct) : null;
      // compute selling price from pct if provided, otherwise use provided sellingPrice
      const unitRaw = (pct != null) ? (costUnit * (1 + (pct / 100))) : (Number(i.sellingPrice) || 0);
      const unit = Number(Number(unitRaw).toFixed(2));
      const value = computeItemValue(unit, qty);
      const totalCostPrice = Number(Number(costUnit * qty).toFixed(2));
      total += value;
      totalCost += totalCostPrice;
      return {
        productId: i.productId || i._id || null,
        productNo: i.productNo || '',
        productName: i.productName || i.name || '',
        brand: i.brand || i.mfg || '',
        model: i.model || i.modelNo || '',
        qty,
        unitSellingPrice: unit,
        value,
        costPrice: costUnit,
        totalCostPrice,
        pct: pct,
        validity: i.validity ? new Date(i.validity) : null
      };
    });

    // Create supply record
  const supply = await BranchSupply.create({ shop_id, branch_id, items: prepared, totalSupplyValue: total, totalSupplyCost: totalCost, createdBy: req.user.userId || req.user.branch_id || '' });

    // Update BranchStock: increment or create per item
    for (const it of prepared) {
      const filter = { shop_id, branch_id, productId: it.productId };
      const update = {
        $set: {
          productNo: it.productNo || '',
          productName: it.productName,
          sellingPrice: Number(Number(it.unitSellingPrice || 0).toFixed(2)),
          brand: it.brand,
          model: it.model,
          validity: it.validity,
          costPrice: it.costPrice,
          updatedBy: req.user.userId || req.user.branch_id || ''
        },
        $inc: { qty: it.qty }
      };

      // If this item references a central InStock item, try to fetch productNo from central
      try {
        const pid = String(it.productId || '');
        if ((!update.$set.productNo || update.$set.productNo === '') && pid.includes('_')) {
          const [docId, idxStr] = pid.split('_');
          const idx = Number(idxStr);
          if (docId && Number.isInteger(idx)) {
            const central = await InStock.findById(docId).lean();
            if (central && Array.isArray(central.items) && central.items[idx]) {
              const centralIt = central.items[idx];
              if (centralIt && centralIt.productNo) {
                update.$set.productNo = centralIt.productNo;
              }
            }
          }
        }
      } catch (e) {
        // ignore central fetch errors; proceed with existing productNo
      }

      await BranchStock.findOneAndUpdate(filter, update, { upsert: true, new: true });

      // If this supply came from a central in-stock product (productId like '<docId>_<idx>'),
      // decrement the central InStock.items[idx].quantity so central and branch stay consistent.
      try {
        const pid = String(it.productId || '');
        if (pid.includes('_')) {
          const [docId, idxStr] = pid.split('_');
          const idx = Number(idxStr);
          if (docId && Number.isInteger(idx)) {
            const central = await InStock.findById(docId).lean();
            if (central && Array.isArray(central.items) && central.items[idx]) {
              const currentQty = Number(central.items[idx].quantity || 0);
              const newQty = Math.max(0, currentQty - Number(it.qty || 0));
              const path = `items.${idx}.quantity`;
              await InStock.findByIdAndUpdate(docId, { $set: { [path]: newQty } });
            }
          }
        }
      } catch (e) {
        console.error('createBranchSupply: failed to decrement central InStock for', it.productId, e && e.message ? e.message : e);
      }
    }

  // Return supply record plus the updated branch stock rows for the branch so frontend can refresh
  // After upserts, try to backfill productNo into saved supply items if missing (fetch from central InStock)
  try {
    for (let i = 0; i < (supply.items || []).length; i++) {
      const it = supply.items[i];
      const pid = String(it.productId || '');
      if ((!it.productNo || it.productNo === '') && pid.includes('_')) {
        const [docId, idxStr] = pid.split('_');
        const idx = Number(idxStr);
        if (docId && Number.isInteger(idx)) {
          const central = await InStock.findById(docId).lean();
          if (central && Array.isArray(central.items) && central.items[idx]) {
            const centralIt = central.items[idx];
            if (centralIt && centralIt.productNo) {
              // update supply item
              await BranchSupply.findByIdAndUpdate(supply._id, { $set: { ['items.' + i + '.productNo']: centralIt.productNo } });
              // update branch stock row as well
              await BranchStock.findOneAndUpdate({ shop_id, branch_id, productId: it.productId }, { $set: { productNo: centralIt.productNo } });
              // also update local supply.items for returning
              supply.items[i].productNo = centralIt.productNo;
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore backfill errors
  }

  const updatedRows = await BranchStock.find({ shop_id, branch_id }).lean();
  // reload supply to include any updates
  const freshSupply = await BranchSupply.findById(supply._id).lean();
  return res.json({ success: true, supply: freshSupply || supply, rows: updatedRows });
  } catch (err) {
    console.error('createBranchSupply error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List current stock for a branch (or all branches if not provided)
exports.listBranchStock = async (req, res) => {
  try {
    const shop_id = req.user.shop_id;
  // optional query filters
  const productNoFilter = (req.query.productNo || req.query.product_no || '').toString();
  const customerNo = (req.query.customerNo || req.query.customer_no || '').toString();
    let branch_id = req.query.branch_id || null;
    
    // If this is a branch user, force filter to their branch only
    if (req.user.isBranch && req.user.branch_id) {
      branch_id = req.user.branch_id;
    }
    
    const onlyBranch = (req.query.only_branch === '1' || req.query.only_branch === 'true');

    // If client requests only branch-specific stock, return BranchStock rows only
    if (onlyBranch) {
      const bid = branch_id || req.user.branch_id || null;
      if (!bid) return res.json({ success: true, rows: [] });
      let rowsOnly = await BranchStock.find({ shop_id, branch_id: bid }).lean();

      // If some branch rows are missing brand/model/validity, try to backfill from central InStock
  const needFill = rowsOnly.filter(r => (!r.brand || r.brand === '') || (!r.model || r.model === '') || !r.validity || (!r.productNo || r.productNo === ''));
      if (needFill.length > 0) {
        // collect central doc ids referenced by productId like '<docId>_<idx>'
        const docIds = Array.from(new Set(needFill.map(r => {
          try { return String(r.productId).includes('_') ? String(r.productId).split('_')[0] : null; } catch(e) { return null; }
        }).filter(Boolean)));
        if (docIds.length > 0) {
          const centralDocs = await InStock.find({ _id: { $in: docIds } }).lean();
          const centralMap = {};
          (centralDocs || []).forEach(d => { centralMap[String(d._id)] = d; });

          rowsOnly = rowsOnly.map(r => {
            try {
              if (((!r.brand || r.brand === '') || (!r.model || r.model === '') || !r.validity || (!r.productNo || r.productNo === '')) && String(r.productId).includes('_')) {
                const [docId, idxStr] = String(r.productId).split('_');
                const idx = Number(idxStr);
                const doc = centralMap[docId];
                if (doc && Array.isArray(doc.items) && Number.isInteger(idx) && doc.items[idx]) {
                  const it = doc.items[idx];
                  if (!r.brand || r.brand === '') r.brand = it.brand || r.brand || '';
                  if (!r.model || r.model === '') r.model = it.model || r.model || '';
                    if (!r.validity) r.validity = it.validity || r.validity || null;
                    if (!r.productNo || r.productNo === '') r.productNo = it.productNo || r.productNo || '';
                }
              }
            } catch (e) {
              // ignore fill errors
            }
            return r;
          });

          // Persist any productNo backfills into BranchStock so subsequent requests include it
          try {
            for (const r of rowsOnly) {
              try {
                if (r.productNo && String(r.productId || '').includes('_')) {
                  await BranchStock.findOneAndUpdate({ shop_id, branch_id: bid, productId: r.productId }, { $set: { productNo: r.productNo } });
                }
              } catch (e) { /* ignore individual update errors */ }
            }
          } catch (e) { /* ignore persistence errors */ }
        }
      }

      // apply server-side productNo filter if provided
      let rowsFiltered = rowsOnly;
      if (productNoFilter) {
        const needle = productNoFilter.toLowerCase();
        rowsFiltered = rowsOnly.filter(r => (String(r.productNo || '').toLowerCase().includes(needle)));
      }
      return res.json({ success: true, rows: rowsFiltered, customerNo: customerNo || null });
    }

    const q = { shop_id };
    if (branch_id) q.branch_id = branch_id;
    let rows = await BranchStock.find(q).lean();

    // Build an aggregated list of central InStock items (flatten items[])
    const centralDocs = await InStock.find({ shop_id }).lean();
    const centralAgg = [];
    (centralDocs || []).forEach(doc => {
      const docId = doc._id ? String(doc._id) : '';
      const items = Array.isArray(doc.items) ? doc.items : [];
      items.forEach((it, idx) => {
        const qty = (it.quantity ?? it.qty ?? 0);
        const costPrice = (it.costPrice ?? it.cost ?? 0);
          centralAgg.push({
          shop_id,
          branch_id: branch_id || '',
          productId: `${docId}_${idx}`,
          productNo: it.productNo || '',
          productName: it.productName || it.name || '',
          brand: it.brand || '',
          model: it.model || '',
          qty: qty,
          costPrice: costPrice,
          sellingPrice: (it.sellingPrice ?? it.price ?? it.costPrice ?? 0),
          validity: it.validity || null,
          totalCostPrice: (Number(qty) * Number(costPrice || 0))
        });
      });
    });

    // If a branch is requested, merge central items with branch-specific rows
  if (branch_id) {
      const branchRows = await BranchStock.find({ shop_id, branch_id }).lean();
      const branchMap = {};
      (branchRows || []).forEach(br => { branchMap[String(br.productId)] = br; });

      // Merge: prefer central list but override qty/sellingPrice from branch when present
  const merged = centralAgg.map(c => {
        const br = branchMap[c.productId];
        const centralQty = Number(c.qty || 0);
        const branchQty = br ? Number(br.qty || 0) : 0;
        const totalQty = centralQty + branchQty;
        const costPrice = br ? (br.costPrice ?? c.costPrice) : c.costPrice;
        return {
          shop_id,
          branch_id,
          productId: c.productId,
          productNo: c.productNo || (br ? br.productNo : '') || '',
          productName: c.productName,
          brand: c.brand,
          model: c.model,
          // expose central and branch qty separately
          centralQty: centralQty,
          branchQty: branchQty,
          // Total qty = central qty + branch qty
          qty: totalQty,
          // costPrice prefer branch then central
          costPrice: costPrice,
          // Selling price: branch override if present, else central sellingPrice
          sellingPrice: br ? (br.sellingPrice ?? c.sellingPrice) : c.sellingPrice,
          validity: br ? (br.validity || c.validity) : c.validity,
          totalCostPrice: Number(totalQty) * Number(costPrice || 0)
        };
      });

      // Include any branch-only items that don't exist in centralAgg
      const centralIds = new Set(centralAgg.map(c => String(c.productId)));
      (branchRows || []).forEach(br => {
        if (!centralIds.has(String(br.productId))) {
          const qty = br.qty ?? 0;
          const costPrice = br.costPrice ?? 0;
          merged.push({
            shop_id,
            branch_id,
            productId: br.productId,
            productNo: br.productNo || '',
            productName: br.productName || '',
            brand: br.brand || '',
            model: br.model || '',
            qty: qty,
            costPrice: costPrice,
            sellingPrice: br.sellingPrice ?? 0,
            validity: br.validity || null,
            totalCostPrice: Number(qty) * Number(costPrice || 0)
          });
        }
      });

      rows = merged;
    } else {
      // No branch requested: return central aggregated items
      rows = centralAgg;
    }

    // apply productNo filter if provided
    if (productNoFilter) {
      const needle = productNoFilter.toLowerCase();
      rows = (rows || []).filter(r => (String(r.productNo || '').toLowerCase().includes(needle)));
    }

    return res.json({ success: true, rows, customerNo: customerNo || null });
  } catch (err) {
    console.error('listBranchStock error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List supplies for the shop (admin view)
exports.listSuppliesForShop = async (req, res) => {
  try {
    const shop_id = req.user.shop_id;
    let branch_id = req.query.branch_id || null;
    
    // If this is a branch user, force filter to their branch only
    if (req.user.isBranch && req.user.branch_id) {
      branch_id = req.user.branch_id;
    }
    
    const query = { shop_id };
    if (branch_id) query.branch_id = branch_id;
    
    let supplies = await BranchSupply.find(query).sort({ createdAt: -1 }).lean();

    // Enrich items by backfilling brand/model/validity and supplier from central InStock docs
    // Collect all referenced central doc ids
    const docIds = new Set();
    (supplies || []).forEach(s => {
      (Array.isArray(s.items) ? s.items : []).forEach(it => {
        try { if (String(it.productId || '').includes('_')) docIds.add(String(it.productId).split('_')[0]); } catch (e) {}
      });
    });

    if (docIds.size > 0) {
      const docs = await InStock.find({ _id: { $in: Array.from(docIds) } }).populate('supplier_id', 'supplierName agencyName').lean();
      const docMap = {};
      (docs || []).forEach(d => { docMap[String(d._id)] = d; });

      supplies = (supplies || []).map(s => {
        const items = (Array.isArray(s.items) ? s.items : []).map(it => {
          try {
            if (String(it.productId || '').includes('_')) {
              const [docId, idxStr] = String(it.productId).split('_');
              const idx = Number(idxStr);
              const doc = docMap[docId];
              if (doc && Array.isArray(doc.items) && Number.isInteger(idx) && doc.items[idx]) {
                const centralItem = doc.items[idx];
                // backfill fields only if missing
                if (!it.brand || it.brand === '') it.brand = centralItem.brand || it.brand || '';
                if (!it.model || it.model === '') it.model = centralItem.model || it.model || '';
                if (!it.validity) it.validity = centralItem.validity || it.validity || null;
                if (!it.productNo || it.productNo === '') it.productNo = centralItem.productNo || it.productNo || '';
                // supplier name from central doc
                it.supplierName = (doc.supplier_id && (doc.supplier_id.supplierName || doc.supplier_id.agencyName)) || it.supplierName || '';
              }
            }
          } catch (e) {
            // ignore
          }
          return it;
        });
        return { ...s, items };
      });
    }

    return res.json({ success: true, supplies });
  } catch (err) {
    console.error('listSuppliesForShop error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
