const XLSX = require("xlsx");
const MaterialMovement = require("../model/materialMovement");
const ExcelJS = require("exceljs");

const normalizeProjectName = (value) => {
  if (value === undefined || value === null) return "";

  const text = String(value).trim();

  if (!text || text.toUpperCase() === "NA") {
    return "";
  }

  const normalized = text.toLowerCase();

  switch (normalized) {

    case "210 tph nirma":
    case "nirma":
    case "210 tph nirma project":
      return "210_TPH_NIRMA";

    case "bdd chawl tpl":
    case "bdd chawl":
      return "TATA_BDD_Chawl";

    case "capacity_noida_opus":
    case "capacity noida opus":
      return "CAPACITE_NOIDA_OPUS";

    case "dfccil project":
    case "dfccil":
      return "DFCCIL_Project";

    case "ele gmbdba project":
      return "SPCPL_MUMBAI";

    case "electrical work sau_new delhi":
    case "electrical work sau":
      return "SAU_DELHI";

    case "jpwipl project":
    case "jpwipl":
      return "JPW SHALIMAR";

    case "jucso tmh g+6":
      return "TS_JUCSO";

    case "jupalco kathua":
      return "JUPALCO NEW CASTER";

    case "l&t kota":
      return "LNT_CFCL_KOTA";

    case "lighting pole work hmm bawal":
      return "BAWL_Project";

    case "m3m sec - 111 project":
    case "m3m sec - 111":
      return "M3M_CROWN_111";

    case "m3m sec - 67 project":
    case "m3m sec - 67":
      return "M3M_MERLIN_OPUS";

    case "mhs pkg.b5 adani krishnapatnam":
      return "TKIL_KRISHNAPATNAM";

    case "microsoft tpl":
      return "Microsoft TPL";

    case "returnable material":
      return "Returnable Material";

    case "rlda_dra_adi project":
      return "RLDA_DRA_ADI";

    case "shapoorji leh":
      return "SPCPL_Leh Airport";

    default:
      return text;
  }
};

const normalizeCompanyName = (value) => {
  if (value === undefined || value === null) return "";

  const text = String(value).trim();

  if (!text || text.toUpperCase() === "NA") {
    return "";
  }

  const normalized = text.toUpperCase();

  switch (normalized) {
    case "SACHIN ELECTRICAL PRIVATE LIMITED":
    case "SACHIN ELECTRICAL PVT LTD":
    case "SACHIN ELECTRICAL PVT. LTD.":
    case "SACHIN ELECTRICAL":
      return "SEPL";

    case "SACHIN POWER PROJECTS PRIVATE LIMITED":
    case "SACHIN POWER PROJECT PRIVATE LIMITED":
    case "SACHIN POWER PROJECTS PVT LTD":
    case "SACHIN POWER PROJECTS PVT. LTD.":
      return "SPPPL";

    default:
      return text;
  }
};


const normalizeInOut = (value) => {
  if (value === undefined || value === null) return "";

  const text = String(value).trim();

  if (!text || text.toUpperCase() === "NA") {
    return "";
  }

  const normalized = text.toUpperCase();

  switch (normalized) {
    case "IN":
      return "In";

    case "OUT":
      return "Out";

    default:
      return text;
  }
};

const cleanString = (value) => {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  if (text.toUpperCase() === "NA") return "";
  return text;
};

const cleanNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const cleanDate = (value) => {
  if (!value || value === "NA") return null;

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};


const buildMaterialFilter = (query) => {
  const {
    itemName,
    projectName,
    vendorName,
    documentNo,
    invoiceNumber,
    inOut,
    fromDate,
    toDate,
  } = query;

  const filter = {};

  if (itemName) filter.itemName = { $regex: itemName.trim(), $options: "i" };
  if (projectName) filter.projectName = { $regex: projectName.trim(), $options: "i" };
  if (vendorName) filter.vendorName = { $regex: vendorName.trim(), $options: "i" };
  if (documentNo) filter.documentNo = { $regex: documentNo.trim(), $options: "i" };
  if (invoiceNumber) filter.invoiceNumber = { $regex: invoiceNumber.trim(), $options: "i" };
  if (inOut) filter.inOut = inOut;

  if (fromDate || toDate) {
    filter.documentDate = {};
    if (fromDate) filter.documentDate.$gte = new Date(fromDate);
    if (toDate) filter.documentDate.$lte = new Date(toDate);
  }

  return filter;
};

//Export  excel as on per filter
exports.exportMaterialMovementExcel = async (req, res) => {
  try {
    const filter = buildMaterialFilter(req.query);

    const records = await MaterialMovement.find(filter)
      .sort({ documentDate: -1, createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    //  Summary
    const summaryAgg = await MaterialMovement.aggregate([
  {
    $match: filter,
  },
  {
    $group: {
      _id: null,
      totalRecords: { $sum: 1 },
      totalQuantity: { $sum: "$quantity" },
      totalAmount: { $sum: "$amount" },
      totalInward: {
        $sum: {
          $cond: [{ $eq: ["$inOut", "In"] }, 1, 0],
        },
      },
      totalOutward: {
        $sum: {
          $cond: [{ $eq: ["$inOut", "Out"] }, 1, 0],
        },
      },
    },
  },
]);

const topVendors = await MaterialMovement.aggregate([
  {
    $match: filter,
  },
  {
    $group: {
      _id: "$vendorName",
      amount: { $sum: "$amount" },
    },
  },
  {
    $sort: {
      amount: -1,
    },
  },
  {
    $limit: 10,
  },
]);

const topProjects = await MaterialMovement.aggregate([
  {
    $match: filter,
  },
  {
    $group: {
      _id: "$projectName",
      quantity: { $sum: "$quantity" },
    },
  },
  {
    $sort: {
      quantity: -1,
    },
  },
  {
    $limit: 10,
  },
]);

const topItems = await MaterialMovement.aggregate([
  {
    $match: filter,
  },
  {
    $group: {
      _id: "$itemName",
      quantity: { $sum: "$quantity" },
    },
  },
  {
    $sort: {
      quantity: -1,
    },
  },
  {
    $limit: 10,
  },
]);
    const worksheet = workbook.addWorksheet("Material Movement");

    worksheet.columns = [
      { header: "Date", key: "documentDate", width: 15 },
      { header: "Item Name", key: "itemName", width: 35 },
      { header: "UOM", key: "uom", width: 12 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "HSN Code", key: "hsnCode", width: 15 },
      { header: "BOQ No", key: "boqNo", width: 15 },
      { header: "Rate", key: "rate", width: 12 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Project Name", key: "projectName", width: 30 },
      { header: "Project Code", key: "projectCode", width: 18 },
      { header: "Vendor Name", key: "vendorName", width: 30 },
      { header: "Document No", key: "documentNo", width: 20 },
      { header: "Document Name", key: "documentName", width: 20 },
      { header: "Invoice Number", key: "invoiceNumber", width: 20 },
      { header: "Invoice Date", key: "invoiceDate", width: 15 },
      { header: "In / Out", key: "inOut", width: 12 },
      { header: "Transport Name", key: "transportName", width: 25 },
      { header: "Vehicle Number", key: "vehicleNumber", width: 18 },
      { header: "Concerned Person", key: "concernedPersonAtSite", width: 25 },
      { header: "Company Name", key: "companyName", width: 18 },
      { header: "Brand Make", key: "brandMake", width: 20 },
      { header: "Category", key: "category", width: 18 },
      { header: "Commodity", key: "commodity", width: 18 },
      { header: "MEP Head", key: "mepHead", width: 18 },
      { header: "Remarks", key: "remarks", width: 35 },
    ];

//     worksheet.getRow(1).font = { bold: true };
// worksheet.autoFilter = {
//   from: "A1",
//   to: "Y1",
// };

// worksheet.views = [{ state: "frozen", ySplit: 1 }];
    records.forEach((item) => {
      worksheet.addRow({
        documentDate: item.documentDate
          ? new Date(item.documentDate).toLocaleDateString("en-IN")
          : "",
        itemName: item.itemName || "",
        uom: item.uom || "",
        quantity: item.quantity || 0,
        hsnCode: item.hsnCode || "",
        boqNo: item.boqNo || "",
        rate: item.rate || 0,
        amount: item.amount || 0,
        projectName: item.projectName || "",
        projectCode: item.projectCode || "",
        vendorName: item.vendorName || "",
        documentNo: item.documentNo || "",
        documentName: item.documentName || "",
        invoiceNumber: item.invoiceNumber || "",
        invoiceDate: item.invoiceDate
          ? new Date(item.invoiceDate).toLocaleDateString("en-IN")
          : "",
        inOut: item.inOut || "",
        transportName: item.transportName || "",
        vehicleNumber: item.vehicleNumber || "",
        concernedPersonAtSite: item.concernedPersonAtSite || "",
        companyName: item.companyName || "",
        brandMake: item.brandMake || "",
        category: item.category || "",
        commodity: item.commodity || "",
        mepHead: item.mepHead || "",
        remarks: item.remarks || "",
      });
    });

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary");

summarySheet.columns = [
  { header: "Metric", key: "metric", width: 35 },
  { header: "Value", key: "value", width: 30 },
];

summarySheet.getRow(1).font = { bold: true };

const summary = summaryAgg[0] || {};

summarySheet.addRows([
  {
    metric: "Total Records",
    value: summary.totalRecords || 0,
  },
  {
    metric: "Total Quantity",
    value: summary.totalQuantity || 0,
  },
  {
    metric: "Total Amount",
    value: summary.totalAmount || 0,
  },
  {
    metric: "Total Inward",
    value: summary.totalInward || 0,
  },
  {
    metric: "Total Outward",
    value: summary.totalOutward || 0,
  },
]);

// Top Vendor Shet 
const vendorSheet = workbook.addWorksheet("Top Vendors");

vendorSheet.columns = [
  { header: "Vendor Name", key: "vendor", width: 40 },
  { header: "Amount", key: "amount", width: 20 },
];

vendorSheet.getRow(1).font = { bold: true };

topVendors.forEach((vendor) => {
  vendorSheet.addRow({
    vendor: vendor._id || "-",
    amount: vendor.amount || 0,
  });
});
// Top Project Sheet
const projectSheet = workbook.addWorksheet("Top Projects");

projectSheet.columns = [
  { header: "Project Name", key: "project", width: 40 },
  { header: "Quantity", key: "quantity", width: 20 },
];

projectSheet.getRow(1).font = { bold: true };

topProjects.forEach((project) => {
  projectSheet.addRow({
    project: project._id || "-",
    quantity: project.quantity || 0,
  });
});

//Top Items Sheet
const itemSheet = workbook.addWorksheet("Top Items");

itemSheet.columns = [
  { header: "Item Name", key: "item", width: 50 },
  { header: "Quantity", key: "quantity", width: 20 },
];

itemSheet.getRow(1).font = { bold: true };

topItems.forEach((item) => {
  itemSheet.addRow({
    item: item._id || "-",
    quantity: item.quantity || 0,
  });
});

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=MaterialMovementHistory.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Export Material Movement Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.createMaterialMovement = async (req, res) => {
  try {
    const movement = await MaterialMovement.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Material movement created successfully",
      data: movement,
    });
  } catch (error) {
    console.log("Create Material Movement Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upadte 
exports.updateMaterialMovement = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MaterialMovement.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Material movement record not found",
      });
    }

    const allowedFields = [
      "itemName",
      "uom",
      "quantity",
      "hsnCode",
      "boqNo",
      "rate",
      "amount",
      "storeItemCode",
      "typeOfTransit",
      "materialInwardFor",
      "projectName",
      "projectCode",
      "documentNo",
      "documentDate",
      "documentName",
      "vendorName",
      "vendorPONumber",
      "invoiceNumber",
      "invoiceDate",
      "transportName",
      "vehicleNumber",
      "concernedPersonAtSite",
      "materialReturnedFromSite",
      "remarks",
      "companyName",
      "brandMake",
      "model",
      "category",
      "commodity",
      "mepHead",
      "installationActivity",
      "primarySecondaryUOM",
      "multiplicationFactor",
      "minimumStockLevel",
      "reorderLevel",
      "openingStock",
      "storageLocation",
      "dateOfRegistration",
      "itemImageHyperlink",
      "registeredItem",
      "itemProjectSite",
      "consigneeName",
      "consigneeAddress",
      "datePunchTime",
      "inOut",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    if (record.quantity && record.rate) {
      record.amount = Number(record.quantity || 0) * Number(record.rate || 0);
    }

    const updatedRecord = await record.save();

    return res.status(200).json({
      success: true,
      message: "Material movement updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.log("Update Material Movement Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.bulkUploadMaterialMovement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    // Buffer to uplaod Excel 
    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    console.log(rows[0])

    const preparedData = rows
      .map((row) => ({
        itemName: cleanString(
          row["Item Name"] ||
          row["Material Description"] ||
          row["Material Discription"]
        ),

        uom: cleanString(row["UOM"]),
        quantity: cleanNumber(row["QTY"] || row["Qty"] || row["Quantity"]),

        hsnCode: cleanString(row["HSN Code"] || row["HSN"]),
        boqNo: cleanString(row["BOQ No"] || row["BOQ"]),

        rate: cleanNumber(row["Rate"]),
        amount: cleanNumber(row["Amount"]),

        storeItemCode: cleanString(row["Store Item Code"]),
        typeOfTransit: cleanString(row["Type of Transit"]),

        materialInwardFor: cleanString(row["Material Inward For"]),

        projectName: normalizeProjectName(
          row["Name of project"] || row["Project Name"]
        ),
        projectCode: cleanString(row["Project Code"]),

        documentNo: cleanString(row["Document No"]),
        documentDate: cleanDate(row["Document Date"]),
        documentName: cleanString(row["Document Name"]),

        vendorName: cleanString(row["Vendor Name"]),
        vendorPONumber: cleanString(row["Vendor PO Number"]),

        invoiceNumber: cleanString(row["Invoice Number"]),
        invoiceDate: cleanDate(row["Invoice Date"]),

        transportName: cleanString(row["Transport Name"]),
        vehicleNumber: cleanString(row["Vehicle Number"]),

        concernedPersonAtSite: cleanString(row["Concerned Person at Site"]),
        materialReturnedFromSite: cleanString(row["Material Returned From Site"]),

        remarks: cleanString(row["Remarks"]),

        companyName: normalizeCompanyName(
          row["Name of Company"] || row["Company Name"]
        ),
        brandMake: cleanString(row["Brand / Make"] || row["Brand Make"]),
        model: cleanString(row["Model"]),
        category: cleanString(row["Category"]),
        commodity: cleanString(row["Commodity"]),
        mepHead: cleanString(row["MEP Head"]),

        installationActivity: cleanString(row["Installation Activity"]),
        primarySecondaryUOM: cleanString(row["Primary Secondary UOM"]),
        multiplicationFactor: cleanNumber(row["Multiplication Factor"]) || 1,

        minimumStockLevel: cleanNumber(row["Minimum Stock Level"]),
        reorderLevel: cleanNumber(row["Reorder Level"]),
        openingStock: cleanNumber(row["Opening Stock"]),
        storageLocation: cleanString(row["Storage Location"]),

        dateOfRegistration: cleanDate(row["Date of Registration"]),
        itemImageHyperlink: cleanString(row["Item Image Hyperlink"]),
        registeredItem: cleanString(row["Registered Item"]),

        itemProjectSite: cleanString(row["Item Project Site"]),
        consigneeName: cleanString(row["Consignee Name"]),
        consigneeAddress: cleanString(row["Consignee Address"]),

        datePunchTime: cleanDate(row["Date Punch Time"]) || new Date(),

        inOut: normalizeInOut(row["In / Out"] || row["IN/OUT"]),

        sourceModule: "ExcelUpload",
        createdBy: req.user?._id || null,
      }))
      .filter((item) => item.itemName);

    if (!preparedData.length) {
      return res.status(400).json({
        success: false,
        message: "No valid item rows found in Excel",
      });
    }

    const inserted = await MaterialMovement.insertMany(preparedData, {
      ordered: false,
    });

    return res.status(201).json({
      success: true,
      message: "Material movement Excel uploaded successfully",
      totalRows: rows.length,
      insertedRows: inserted.length,
      skippedRows: rows.length - preparedData.length,
      data: inserted,
    });
  } catch (error) {
    console.log("Bulk Material Movement Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMaterialHistory = async (req, res) => {
  try {
    const {
      itemName, projectName, vendorName, documentNo,
      invoiceNumber, inOut, fromDate, toDate,
      page = 1, limit = 20
    } = req.query;

    const filter = {};

    if (itemName) filter.itemName = { $regex: itemName.trim(), $options: "i" };
    if (projectName) filter.projectName = { $regex: projectName.trim(), $options: "i" };
    if (vendorName) filter.vendorName = { $regex: vendorName.trim(), $options: "i" };
    if (documentNo) filter.documentNo = { $regex: documentNo.trim(), $options: "i" };
    if (invoiceNumber) filter.invoiceNumber = { $regex: invoiceNumber.trim(), $options: "i" };
    if (inOut) filter.inOut = inOut;

    if (fromDate || toDate) {
      filter.documentDate = {};
      if (fromDate) filter.documentDate.$gte = new Date(fromDate);
      if (toDate) filter.documentDate.$lte = new Date(toDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, totalRecords, summary] = await Promise.all([
      MaterialMovement.find(filter)
        .sort({ documentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      MaterialMovement.countDocuments(filter),

      MaterialMovement.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$quantity" },
            totalAmount: { $sum: "$amount" },
            inCount: {
              $sum: { $cond: [{ $eq: ["$inOut", "In"] }, 1, 0] }
            },
            outCount: {
              $sum: { $cond: [{ $eq: ["$inOut", "Out"] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    return res.status(200).json({
      success: true,
      data,
      summary: summary[0] || {
        totalQuantity: 0,
        totalAmount: 0,
        inCount: 0,
        outCount: 0
      },
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getItemHistory = async (req, res) => {
  try {
    const { itemName } = req.query;

    if (!itemName) {
      return res.status(400).json({
        success: false,
        message: "Item name is required",
      });
    }

    const data = await MaterialMovement.find({
      itemName: { $regex: itemName.trim(), $options: "i" },
    }).sort({ documentDate: -1, createdAt: -1 });

    const totalQty = data.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    const totalAmount = data.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      summary: {
        itemName,
        totalQty,
        totalAmount,
        totalRecords: data.length,
      },
      data,
    });
  } catch (error) {
    console.log("Item History Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteMaterialMovementByTime = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to time are required",
      });
    }

    const result = await MaterialMovement.deleteMany({
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.previewMaterialMovementByTime = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to time are required",
      });
    }

    const records = await MaterialMovement.find({
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Material Analytical Reports
exports.getMaterialMovementAnalytics = async (req, res) => {
  try {
    const summaryAgg = await MaterialMovement.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          totalInward: {
            $sum: { $cond: [{ $eq: ["$inOut", "In"] }, 1, 0] },
          },
          totalOutward: {
            $sum: { $cond: [{ $eq: ["$inOut", "Out"] }, 1, 0] },
          },
        },
      },
    ]);

    const trendData = await MaterialMovement.aggregate([
      {
        $match: {
          documentDate: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%d %b",
                date: "$documentDate",
              },
            },
            inOut: "$inOut",
          },
          quantity: { $sum: "$quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          inward: {
            $sum: {
              $cond: [{ $eq: ["$_id.inOut", "In"] }, "$quantity", 0],
            },
          },
          outward: {
            $sum: {
              $cond: [{ $eq: ["$_id.inOut", "Out"] }, "$quantity", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          inward: 1,
          outward: 1,
        },
      },
      { $limit: 30 },
    ]);

    const topItems = await MaterialMovement.aggregate([
      {
        $group: {
          _id: "$itemName",
          quantity: { $sum: "$quantity" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          itemName: "$_id",
          quantity: 1,
        },
      },
    ]);

    const topVendors = await MaterialMovement.aggregate([
      {
        $group: {
          _id: "$vendorName",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          vendorName: "$_id",
          amount: 1,
        },
      },
    ]);

    const projectWise = await MaterialMovement.aggregate([
      {
        $group: {
          _id: "$projectName",
          quantity: { $sum: "$quantity" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          projectName: "$_id",
          quantity: 1,
        },
      },
    ]);

    const monthlyAmount = await MaterialMovement.aggregate([
      {
        $match: {
          documentDate: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$documentDate" },
            month: { $month: "$documentDate" },
          },
          amount: { $sum: "$amount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.year" },
            ],
          },
          amount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      summary: summaryAgg[0] || {
        totalRecords: 0,
        totalQuantity: 0,
        totalAmount: 0,
        totalInward: 0,
        totalOutward: 0,
      },
      trendData,
      topItems,
      topVendors,
      projectWise,
      monthlyAmount,
    });
  } catch (error) {
    console.log("Material Movement Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};