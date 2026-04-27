const express = require("express");
const ExcelJS = require("exceljs");
const fs = require("fs");
const cors=require('cors');
const app = express();
const PORT = 5000;
const connectDB=require('./config/db');
const TaxInvoiceRegister=require('./model/taxInvoiceRegisterSchema');
const dotenv=require('dotenv').config();


// alllow  other Port use server Resources
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json());

// Add multiple item of site for Opening stock
app.post("/add-items", async (req, res) => {
  try {
    const { date, items } = req.body;

    /*
      Frontend Payload Example:

      {
        "date": "03-04-2026",
        "items": [
          {
            "description": "Item A",
            "qty": 3
          },
          {
            "description": "Item B",
            "qty": 5
          }
        ]
      }
    */

    if (!date || !items || items.length === 0) {
      return res.status(400).json({
        message: "Date and items are required",
      });
    }

    const filePath = "SPCPL_Ghwhati.xlsx";
    const workbook = new ExcelJS.Workbook();

    // If file exists → read it
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
    } else {
      // If file does not exist → create new workbook + sheet
      workbook.addWorksheet("Items");
    }

    const sheet =
      workbook.getWorksheet("Items") || workbook.getWorksheet(1);

    // -----------------------------
    // STEP 1: Find Date Column
    // -----------------------------
    let targetCol = null;

    sheet.getRow(1).eachCell((cell, colNumber) => {
      if (String(cell.value).trim() === String(date).trim()) {
        targetCol = colNumber;
      }
    });

    // If date column not found → create new date column
    if (!targetCol) {
      targetCol = sheet.columnCount + 1;
      sheet.getRow(1).getCell(targetCol).value = date;
    }

    // Ensure first column header exists
    if (!sheet.getRow(1).getCell(1).value) {
      sheet.getRow(1).getCell(1).value = "Description";
    }

    // -----------------------------
    // STEP 2: Add / Update Rows
    // -----------------------------
    for (const item of items) {
      const { description, qty } = item;

      if (!description || qty === undefined) continue;

      let targetRow = null;

      // Find existing row by Description
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header row

        const firstCell = row.getCell(1).value;

        if (
          String(firstCell).trim().toLowerCase() ===
          String(description).trim().toLowerCase()
        ) {
          targetRow = rowNumber;
        }
      });

      // If item not found → create new row
      if (!targetRow) {
        targetRow = sheet.rowCount + 1;
        sheet.getRow(targetRow).getCell(1).value = description;
      }

      // Put qty in respective date column
      sheet.getRow(targetRow).getCell(targetCol).value = qty;
    }

    // -----------------------------
    // STEP 3: Save Excel File
    // -----------------------------
    await workbook.xlsx.writeFile(filePath);

    res.status(200).json({
      message: "Excel updated successfully 🚀",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
//  Register Tax Invoice 
app.post("/tax-invoice-register",async (req,res)=>{
   try {
    const formData = req.body;

    const {
      invoiceDate,
      invoiceNumber,
      invoiceAmount,
      vendorName,
      projectSite,
      challanCreated,
      challanNumber,
      challanDate,
      deliveryStatus,
      quantitySent,
      quantityReceived,
      itemDetailsRequired,
    } = formData;

    if (!invoiceNumber) {
      return res.status(400).json({
        message: "Invoice Number is required",
      });
    }

    const filePath = "Tax_Invoice_Register.xlsx";
    const workbook = new ExcelJS.Workbook();

    // Read existing file or create new
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
    } else {
      workbook.addWorksheet("Invoice Register");
    }

    const sheet =
      workbook.getWorksheet("Invoice Register") ||
      workbook.getWorksheet(1);

    // Header Row
    if (sheet.rowCount === 0) {
      sheet.addRow([
        "Invoice Date",
        "Invoice Number",
        "Invoice Amount",
        "Vendor Name",
        "Project Site",
        "Challan Created",
        "Challan Number",
        "Challan Date",
        "Delivery Status",
        "Quantity Sent",
        "Quantity Received",
        "Material Difference",
        "Item Details Required",
      ]);
    }

    // Material Difference Logic
    let materialDifference = "No Difference";

    if (
      quantitySent &&
      quantityReceived &&
      Number(quantitySent) !== Number(quantityReceived)
    ) {
      materialDifference = "Difference Found";
    }

    let targetRow = null;

    // Find row by Invoice Number (Column 2)
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const existingInvoiceNumber = row.getCell(2).value;

      if (
        String(existingInvoiceNumber).trim().toLowerCase() ===
        String(invoiceNumber).trim().toLowerCase()
      ) {
        targetRow = row;
      }
    });

    if (targetRow) {
      // UPDATE existing row
      targetRow.getCell(1).value = invoiceDate || "";
      targetRow.getCell(2).value = invoiceNumber || "";
      targetRow.getCell(3).value = invoiceAmount || "";
      targetRow.getCell(4).value = vendorName || "";
      targetRow.getCell(5).value = projectSite || "";
      targetRow.getCell(6).value = challanCreated || "";
      targetRow.getCell(7).value = challanNumber || "";
      targetRow.getCell(8).value = challanDate || "";
      targetRow.getCell(9).value = deliveryStatus || "";
      targetRow.getCell(10).value = quantitySent || "";
      targetRow.getCell(11).value = quantityReceived || "";
      targetRow.getCell(12).value = materialDifference;
      targetRow.getCell(13).value = itemDetailsRequired || "";
    } else {
      // ADD new row
      sheet.addRow([
        invoiceDate || "",
        invoiceNumber || "",
        invoiceAmount || "",
        vendorName || "",
        projectSite || "",
        challanCreated || "",
        challanNumber || "",
        challanDate || "",
        deliveryStatus || "",
        quantitySent || "",
        quantityReceived || "",
        materialDifference,
        itemDetailsRequired || "",
      ]);
    }

    // Save file
    await workbook.xlsx.writeFile(filePath);

    // FOr the save in MongoDB
     // Find existing invoice
    const existingInvoice = await TaxInvoiceRegister.findOne({
      invoiceNumber: invoiceNumber.trim(),
    });

    if (existingInvoice) {
      // UPDATE existing record
      await TaxInvoiceRegister.findOneAndUpdate(
        { invoiceNumber: invoiceNumber.trim() },
        formData,
        { new: true }
      );
    }   else {
      // CREATE new record
      const newInvoice = new TaxInvoiceRegister(formData);
      await newInvoice.save();

      return res.status(201).json({
        message: "New invoice created successfully 🚀",
      });
    }


    res.status(200).json({
      message: targetRow
        ? "Existing invoice updated successfully 🚀"
        : "New invoice added successfully 🚀",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }

})
// Edit Tax Invoice -->
app.put("/update-tax-invoice/:taxInvoiceId", async (req, res) => {
  try {
    const { taxInvoiceId } = req.params;
    const formData = req.body;

    if (!taxInvoiceId) {
      return res.status(400).json({
        message: "Tax Invoice ID is required",
      });
    }

    // Optional: material difference auto-calculate
    let materialDifference = "No Difference";

    if (
      formData.quantitySent &&
      formData.quantityReceived &&
      Number(formData.quantitySent) !== Number(formData.quantityReceived)
    ) {
      materialDifference = "Difference Found";
    }

    formData.materialDifference = materialDifference;

    // Find and update by MongoDB _id
    const updatedInvoice = await TaxInvoiceRegister.findByIdAndUpdate(
      taxInvoiceId,
      formData,
      {
        new: true, // return updated document
        runValidators: true,
      }
    );

    if (!updatedInvoice) {
      return res.status(404).json({
        message: "Tax Invoice not found",
      });
    }

    res.status(200).json({
      message: "Tax Invoice updated successfully 🚀",
      data: updatedInvoice,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
// Get Particular  tax Invoice  data
app.get("/tax-invoice-register/:taxInvoiceId", async (req, res) => {
  try {
    const { taxInvoiceId } = req.params;

    if (!taxInvoiceId) {
      return res.status(400).json({
        message: "Tax Invoice ID is required",
      });
    }

    // Find single invoice by MongoDB _id
    const invoice = await TaxInvoiceRegister.findById(taxInvoiceId);

    if (!invoice) {
      return res.status(404).json({
        message: "Tax Invoice not found",
      });
    }

    res.status(200).json({
      message: "Tax Invoice fetched successfully 🚀",
      data: invoice,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
// Get Total  Tax Invoice Register
app.get("/total-tax-invoice-register", async (req, res) => {
  try {
    const total = await TaxInvoiceRegister.countDocuments();
    const taxInvoiceList=await TaxInvoiceRegister.find(); 
    
    console.log(taxInvoiceList);
    res.status(200).json({
      message: "Total Tax Invoice Register in DB",
      total: total,
      taxInvoiceList:taxInvoiceList
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB(process.env.MONGO_DB_CONNECTION_URI);
});