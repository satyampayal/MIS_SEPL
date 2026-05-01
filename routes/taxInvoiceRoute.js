const express = require("express");
const { getAllTaxInvoie, getById } = require("../controllers/taxInvoiceController");
const taxInvoiceRouter = express.Router();

taxInvoiceRouter.get('/all',getAllTaxInvoie);
taxInvoiceRouter.get('/get/:taxInvoiceId',getById);


module.exports=taxInvoiceRouter;
