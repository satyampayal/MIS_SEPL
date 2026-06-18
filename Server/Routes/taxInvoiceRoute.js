const express = require("express");
const { getAllTaxInvoie,
   getById, 
   register,
    bulkInvoiceRegister, 
  deleteTaxInnvoice, 
  intoExcel,
   updateInvoice,
  filterTaxInvoices,
  getProjectWiseSpending,
  getPendingChallans,
  getVendorWiseSpending,
  fixInvoiceAndChallanDates,
  fixInvoiceAmounts,
  // updateApprovalChallanStatus
  } = require("../controllers/taxInvoiceController");
const upload = require("../config/multer");
const taxInvoiceRouter = express.Router();

taxInvoiceRouter.get('/all',getAllTaxInvoie);
taxInvoiceRouter.get('/get/:taxInvoiceId',getById);
taxInvoiceRouter.post('/create',  upload.fields([
    { name: "invoiceFile", maxCount: 1 },
    { name: "challanFile", maxCount: 1 }
  ]),register)

taxInvoiceRouter.post('/bulk-entery',bulkInvoiceRegister)
taxInvoiceRouter.delete('/delete/:taxInvoiceId',deleteTaxInnvoice)
// convert Data into Excel Sheet
taxInvoiceRouter.get('/export-excel',intoExcel)
taxInvoiceRouter.put('/update/:taxInvoiceId',upload.any(),updateInvoice)
// Filter
taxInvoiceRouter.get("/filter", filterTaxInvoices);

taxInvoiceRouter.get("/project-spending", getProjectWiseSpending);

taxInvoiceRouter.get("/pending-challans", getPendingChallans);
taxInvoiceRouter.get(
  "/vendor-wise-spending",
  getVendorWiseSpending
);

// Temp
taxInvoiceRouter.get("/fix-invoice-amounts", fixInvoiceAmounts);

// Temp update InoiveApprorval 
// taxInvoiceRouter.put('/update',updateApprovalChallanStatus)



module.exports=taxInvoiceRouter;
