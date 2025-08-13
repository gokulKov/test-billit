const { Mobile } = require("../../models/mongoModels");

const updatePaidAmount = async (req, res) => {
  const { id, paidAmount, updateDate } = req.body;

  if (!id || paidAmount === undefined || !updateDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const existingMobile = await Mobile.findById(id);
    if (!existingMobile) {
      return res.status(404).json({ error: "Mobile not found" });
    }

    const updatedMobile = await Mobile.findByIdAndUpdate(
      id,
      {
        paid_amount: paidAmount,
        update_date: new Date(updateDate),
        delivery_date: existingMobile.delivery_date, // Preserve existing delivery date
      },
      { new: true }
    );

    return res.status(200).json({ success: true, updatedMobile });
  } catch (error) {
    console.error("Error updating paid amount:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { updatePaidAmount };
