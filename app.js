const express = require("express");
const ExcelJS = require("exceljs");
const fs = require("fs");
const cors = require('cors');
const app = express();
const PORT = 5000;
const connectDB = require('./config/db');
const TaxInvoiceRegister = require('./model/taxInvoiceRegisterSchema');
const dotenv = require('dotenv').config();
const Site = require('./model/Site');
const upload = require('./config/multer')
const checkCloudinaryConnection =require('./config/cloudinaryCheck')
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
app.post("/tax-invoice-register", async (req, res) => {
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
    } else {
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
// Get Total  Tax Invoice Register Data
app.get("/total-tax-invoice-register", async (req, res) => {
  try {
    const total = await TaxInvoiceRegister.countDocuments();
    const taxInvoiceList = await TaxInvoiceRegister.find();

    console.log(taxInvoiceList);
    res.status(200).json({
      message: "Total Tax Invoice Register in DB",
      total: total,
      taxInvoiceList: taxInvoiceList
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
// Insert Bulk Tax invoice Data
app.post("/bulk-tax-invoice-register", async (req, res) => {
  try {
    const invoices = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        message: "Please send an array of invoice data",
      });
    }

    // Optional: auto calculate materialDifference
    const formattedInvoices = invoices.map((invoice) => {
      let materialDifference = "No Difference";

      if (
        invoice.quantitySent &&
        invoice.quantityReceived &&
        Number(invoice.quantitySent) !== Number(invoice.quantityReceived)
      ) {
        materialDifference = "Difference Found";
      }

      return {
        ...invoice,
        materialDifference,
      };
    });

    // Insert all records at once
    const savedData = await TaxInvoiceRegister.insertMany(
      formattedInvoices
    );

    res.status(201).json({
      message: "Bulk Tax Invoice Register saved successfully 🚀",
      totalInserted: savedData.length,
      data: savedData,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
// Deleted the  Tax Invoice Record
app.delete("/delete-tax-invoice/:taxInvoiceId", async (req, res) => {
  try {
    const { taxInvoiceId } = req.params;

    if (!taxInvoiceId) {
      return res.status(400).json({
        message: "Tax Invoice ID is required",
      });
    }

    // Find and delete by MongoDB _id
    const deletedInvoice = await TaxInvoiceRegister.findByIdAndDelete(
      taxInvoiceId
    );

    if (!deletedInvoice) {
      return res.status(404).json({
        message: "Tax Invoice not found",
      });
    }

    res.status(200).json({
      message: "Tax Invoice deleted successfully 🚀",
      data: deletedInvoice,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
// Convert Data into excel  sheet
app.get("/export-tax-invoice-excel", async (req, res) => {
  try {
    const invoices = await TaxInvoiceRegister.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tax Invoice Register");

    // Header Row
    worksheet.columns = [
      { header: "Invoice Date", key: "invoiceDate", width: 18 },
      { header: "Invoice Number", key: "invoiceNumber", width: 25 },
      { header: "Invoice Amount", key: "invoiceAmount", width: 18 },
      { header: "Vendor Name", key: "vendorName", width: 35 },
      { header: "Project Site", key: "projectSite", width: 30 },
      { header: "Challan Created", key: "challanCreated", width: 18 },
      { header: "Challan Number", key: "challanNumber", width: 25 },
      { header: "Challan Date", key: "challanDate", width: 18 },
      { header: "Delivery Status", key: "deliveryStatus", width: 18 },
      { header: "Quantity Sent", key: "quantitySent", width: 18 },
      { header: "Quantity Received", key: "quantityReceived", width: 20 },
      { header: "Material Difference", key: "materialDifference", width: 20 }
    ];

    // Add Data Rows
    invoices.forEach((invoice) => {
      worksheet.addRow({
        invoiceDate: invoice.invoiceDate,
        invoiceNumber: invoice.invoiceNumber,
        invoiceAmount: invoice.invoiceAmount,
        vendorName: invoice.vendorName,
        projectSite: invoice.projectSite,
        challanCreated: invoice.challanCreated,
        challanNumber: invoice.challanNumber,
        challanDate: invoice.challanDate,
        deliveryStatus: invoice.deliveryStatus,
        quantitySent: invoice.quantitySent,
        quantityReceived: invoice.quantityReceived,
        materialDifference: invoice.materialDifference
      });
    });

    // Response Headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=TaxInvoiceRegister.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
});
// Filter  Tax invoice list
app.get("/tax-invoice-register", async (req, res) => {
  try {
    const filters = req.query;

    let query = {};

    if (filters.invoiceNumber) {
      query.invoiceNumber = filters.invoiceNumber;
    }

    if (filters.vendorName) {
      query.vendorName = filters.vendorName;
    }

    if (filters.projectSite) {
      query.projectSite = filters.projectSite;
    }

    if (filters.deliveryStatus) {
      query.deliveryStatus = filters.deliveryStatus;
    }

    if (filters.invoiceDate) {
      query.invoiceDate = filters.invoiceDate;
    }

    if (filters.challanNumber) {
      query.challanNumber = filters.challanNumber;
    }

    const data = await TaxInvoiceRegister.find(query);

    res.status(200).json({
      message: "Filtered data fetched successfully",
      data
    });

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
});

/* Start Add Sites */

// Add-Sites Route
app.post("/add-site", upload.single('poFile'), async (req, res) => {
  try {

    console.log("Upload started:", new Date());
    console.log("========== ADD SITE DEBUG ==========");
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);
    const {
      name,
      code,
      location,
      manager,
      phone,
      startDate,
      status,
      progress
    } = req.body;

    // validation
    if (
      !name ||
      !code ||
      !location ||
      !manager ||
      !phone ||
      !startDate
    ) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    // duplicate code check
    const existingSite = await Site.findOne({ code });

    if (existingSite) {
      return res.status(400).json({
        message: "Site code already exists"
      });
    }

    // console.log("New Site Create  sai Phale")

    const newSite = new Site({
      name,
      code,
      location,
      manager,
      phone,
      startDate,
      status,
      progress,
      poFileUrl: req.file ? req.file.path : "",
      poFilePublicId: req.file ? req.file.filename : ""
    });

    // console.log("New Site Create ke Baad")
    await newSite.save();

    res.status(201).json({
      message: "Site added successfully 🚀",
      data: newSite
    });

  } catch (error) {
    console.log("Error haio bhai jii");
    console.log("Upload finished:", new Date());
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
});

// Get Site
app.get('/sites', async (req, res) => {
  try {
    const allSites = await Site.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "All sites fetched successfully",
      data: allSites
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
})

/*
========================================
DELETE SITE
DELETE /delete-site/:siteId
========================================
*/

app.delete("/delete-site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;

    const deletedSite = await Site.findByIdAndDelete(siteId);

    if (!deletedSite) {
      return res.status(404).json({
        message: "Site not found"
      });
    }

    res.status(200).json({
      message: "Site deleted successfully",
      data: deletedSite
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
});

/*
========================================
UPDATE SITE
PUT /update-site/:siteId
========================================
*/

app.put("/update-site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;

    const updatedSite = await Site.findByIdAndUpdate(
      siteId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedSite) {
      return res.status(404).json({
        message: "Site not found"
      });
    }

    res.status(200).json({
      message: "Site updated successfully",
      data: updatedSite
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
});

/*
========================================
GET SINGLE SITE
GET /site/:siteId
========================================
*/

app.get("/site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await Site.findById(siteId);

    if (!site) {
      return res.status(404).json({
        message: "Site not found"
      });
    }

    res.status(200).json({
      message: "Site fetched successfully",
      data: site
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
});

/* End Add Sites */

app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Cloudinary Connection Check
checkCloudinaryConnection();
// MongoDB
  connectDB(process.env.MONGO_DB_CONNECTION_URI);
});