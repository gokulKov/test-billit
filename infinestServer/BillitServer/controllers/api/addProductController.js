const { Product, ProductHistory } = require("../../models/mongoModels");

const addProduct = async (req, res) => {
  const { name, category, costPrice, sellingPrice, quantity, shop_id } = req.body;

  if (!name || !costPrice || !quantity || !shop_id) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const totalCost = costPrice * quantity;

    // Create product
    const newProduct = await Product.create({
      name,
      category,
      costPrice,
      sellingPrice,
      quantity,
      totalCost,
      userId: shop_id, // 👈 This is shop_id
    });

    // Create product history log
    await ProductHistory.create({
      productId: newProduct._id,
      changeType: "ADD",
      quantity,
      costPrice,
      notes: "Initial stock added"
    });

    return res.status(201).json({
      message: "Product added successfully.",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    return res.status(500).json({ error: "Failed to add product." });
  }
};

module.exports = { addProduct };
