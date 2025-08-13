const express = require("express");
const router = express.Router();
const authenticateToken = require("../utils/authMiddleware");


const { createCustomerController } = require("../controllers/api/createCustomerController");
router.post("/createcustomer", authenticateToken, createCustomerController);
const { createDealer } = require("../controllers/api/createDealerController");
router.post("/createdealer",authenticateToken, createDealer);
const { getAllDealers } = require("../controllers/api/getAllDealersController");
router.post("/dealers", authenticateToken, getAllDealers);



const { updateDealer } = require("../controllers/api/updateDealerController");


router.post("/updatedealer",authenticateToken, updateDealer);


const { getTodayRecords } = require("../controllers/api/getTodayRecordsController");


router.post("/recordsToday",authenticateToken, getTodayRecords);




const { getTodayProductRevenue } = require("../controllers/api/getTodayProductRevenueController");


router.post("/products/revenueToday",authenticateToken, getTodayProductRevenue);




const { updateDailySummary } = require("../controllers/api/updateDailySummaryController");


router.post("/daily-summary/update",authenticateToken, updateDailySummary);




const { updateBalance } = require("../controllers/api/updateBalanceController");


router.post("/updateBalance",authenticateToken, updateBalance);


const { toggleMobileStatus } = require("../controllers/api/toggleMobileStatusController");


router.post("/toggle-status",authenticateToken, toggleMobileStatus);


const { updatePaidAmount } = require("../controllers/api/updatePaidAmountController");


router.post("/update-paid-amount",authenticateToken, updatePaidAmount);




const { getFilteredRecords } = require("../controllers/api/getFilteredRecordsController");


router.post("/records",authenticateToken, getFilteredRecords);




const { allUpdateBalance } = require("../controllers/api/allUpdateBalanceController");


router.post("/allUpdateBalance",authenticateToken, allUpdateBalance);


const { getCustomerBalances } = require("../controllers/api/getCustomerBalancesController");


router.post("/customers/balance",authenticateToken, getCustomerBalances);



const { addNotification } = require("../controllers/api/addNotificationController");


router.post("/notifications/add", authenticateToken, addNotification);


const { getNotifications } = require("../controllers/api/getNotificationsController");
router.get("/notifications", authenticateToken, getNotifications);


const { deleteNotification } = require("../controllers/api/deleteNotificationController");


router.delete("/notifications/delete", authenticateToken, deleteNotification);
const { clearAllNotifications } = require("../controllers/api/clearAllNotificationsController");


router.delete("/notifications/clear", authenticateToken, clearAllNotifications);



const { getDealerBalances } = require("../controllers/api/getDealerBalancesController");


router.post("/dealers/balance",authenticateToken, getDealerBalances);


const { clearBalance } = require("../controllers/api/clearBalanceController");


router.put("/invoices/clearBalance",authenticateToken, clearBalance);




const { updateInvoiceBalance } = require("../controllers/api/updateInvoiceBalanceController");


router.put("/invoices/updateBalance",authenticateToken,  updateInvoiceBalance);




const { addProduct } = require("../controllers/api/addProductController");


router.post("/products/add",authenticateToken, addProduct);




const { getProductHistory } = require("../controllers/api/getProductHistoryController");


router.post("/products/history/:productId",authenticateToken, getProductHistory);




const { listProducts } = require("../controllers/api/listProductsController");
router.post("/products/list",authenticateToken, listProducts);


const { sellProduct } = require("../controllers/api/sellProductController");
router.post("/products/sell",authenticateToken, sellProduct);




const { getTodayExpenses } = require("../controllers/api/getTodayExpensesController");


router.post("/expenses/today",authenticateToken, getTodayExpenses);




const { getDailySummaryRevenue } = require("../controllers/api/getDailySummaryRevenueController");


router.post("/daily-summary",authenticateToken, getDailySummaryRevenue);






const { addExpense } = require("../controllers/api/addExpenseController");
router.post("/expenses/add",authenticateToken, addExpense);




const { fetchAllData } = require("../controllers/api/fetchAllDataController");


router.post("/fetchAllData",authenticateToken, fetchAllData);




const { deleteMobileInvoice } = require("../controllers/api/deleteMobileInvoiceController");


router.delete("/invoices/:clientId/:mobileIndex",authenticateToken, deleteMobileInvoice);




const { updateTechnician } = require("../controllers/api/updateTechnicianController");


router.put("/updateTechnician/:id",authenticateToken, updateTechnician);






const { sendWhatsappBill, upload } = require("../controllers/api/sendWhatsappBillController");


// Route for sending PDF via WhatsApp
router.post("/send-whatsapp-bill", upload.single("pdf"), sendWhatsappBill);






const {viewPublicReceiptController} = require("../controllers/api/viewReceiptController")

// Add this new route WITHOUT authentication middleware
router.get("/receipt/public/:id", viewPublicReceiptController);












module.exports = router;



