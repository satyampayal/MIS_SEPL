const express = require("express");
const { getAllTaxInvoie, getById, register } = require("../controllers/taxInvoiceController");
const upload = require("../config/multer");
const taxInvoiceRouter = express.Router();

taxInvoiceRouter.get('/all',getAllTaxInvoie);
taxInvoiceRouter.get('/get/:taxInvoiceId',getById);
// taxInvoiceRouter.post('/register',  upload.any([
//     { name: "invoiceFile", maxCount: 1 },
//     { name: "challanFile", maxCount: 1 }
//   ]),register)

taxInvoiceRouter.post('/register',  upload.any(),register)


module.exports=taxInvoiceRouter;
