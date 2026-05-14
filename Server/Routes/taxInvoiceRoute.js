const express = require("express");
const { getAllTaxInvoie, getById, register, bulkInvoiceRegister, deleteTaxInnvoice, intoExcel, updateInvoice } = require("../controllers/taxInvoiceController");
const upload = require("../config/multer");
const taxInvoiceRouter = express.Router();

taxInvoiceRouter.get('/all',getAllTaxInvoie);
taxInvoiceRouter.get('/get/:taxInvoiceId',getById);
taxInvoiceRouter.post('/create',  upload.fields([
    { name: "invoiceFile", maxCount: 1 },
    { name: "challanFile", maxCount: 1 }
  ]),register)

// taxInvoiceRouter.post('/register',  upload.any(),register)
taxInvoiceRouter.post('/bulk-entery',bulkInvoiceRegister)
taxInvoiceRouter.delete('/delete/:taxInvoiceId',deleteTaxInnvoice)
// convert Data into Excel Sheet
taxInvoiceRouter.get('/export-excel',intoExcel)
taxInvoiceRouter.put('/update/:taxInvoiceId',upload.any(),updateInvoice)

module.exports=taxInvoiceRouter;
