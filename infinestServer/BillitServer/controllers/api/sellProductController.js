const { Product, ProductHistory } = require("../../models/mongoModels");

const sellProduct = async (req, res) => {
  const { productId, quantitySold, paidAmount } = req.body;

  if (!productId || !quantitySold || paidAmount === undefined) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const product = await Product.findById(productId);
    if (!product || product.quantity < quantitySold) {
      return res.status(400).json({ error: "Insufficient stock or invalid product." });
    }

    const updatedQuantity = product.quantity - quantitySold;
    const updatedTotalCost = updatedQuantity * product.costPrice;

    await Product.findByIdAndUpdate(productId, {
      quantity: updatedQuantity,
      totalCost: updatedTotalCost,
    });

    await ProductHistory.create({
      productId,
      changeType: "SELL",
      quantity: quantitySold,
      costPrice: product.costPrice,
      paidAmount,
      notes: "Product sold",
    });

    return res.status(200).json({ message: "Product sold successfully." });
  } catch (error) {
    console.error("Error selling product:", error);
    return res.status(500).json({ error: "Failed to process sale." });
  }
};

module.exports = { sellProduct };
