const XLSX = require("xlsx");
const MaterialMovement = require("../model/materialMovement");
const ExcelJS = require("exceljs");
const ProjectMaster = require("../model/Project");
const Bill = require("../model/projectBill");
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
const PROJECT_IN_TYPES = ["DDC", "DC", "LPN"];
const PROJECT_OUT_TYPES = ["MRS"];

const HEAD_STORE_IN_TYPES = ["MRN", "MRS"];
const HEAD_STORE_OUT_TYPES = ["DC"];

const getProjectDirection = (typeOfTransit) => {
  const type = String(typeOfTransit || "").toUpperCase();

  if (PROJECT_IN_TYPES.includes(type)) return "In";
  if (PROJECT_OUT_TYPES.includes(type)) return "Out";

  return "";
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
//Upload bulk data
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
              $sum: {
                $cond: [
                  { $in: ["$typeOfTransit", PROJECT_IN_TYPES] },
                  1,
                  0,
                ],
              },
            },
            outCount: {
              $sum: {
                $cond: [
                  { $in: ["$typeOfTransit", PROJECT_OUT_TYPES] },
                  1,
                  0,
                ],
              },
            },
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
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["DDC", "DC", "LPN"]],
                },
                1,
                0,
              ],
            },
          },

          totalOutward: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["MRS", "MRNs"]],
                },
                1,
                0,
              ],
            },
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
          inwardQty: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["DDC", "DC", "LPN"]],
                },
                "$quantity",
                0,
              ],
            },
          },

          outwardQty: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["MRS", "MRN"]],
                },
                "$quantity",
                0,
              ],
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


// Project wise anlytics reports 
exports.getProjectWiseMaterialHistory = async (req, res) => {
  try {
    const data = await MaterialMovement.aggregate([
      {
        $group: {
          _id: "$projectName",

          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },

          totalEntries: { $sum: 1 },

          materials: { $addToSet: "$itemName" },
          vendors: { $addToSet: "$vendorName" },

          inwardQty: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["DDC", "DC", "LPN"]],
                },
                "$quantity",
                0,
              ],
            },
          },

          outwardQty: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["MRS"]],
                },
                "$quantity",
                0,
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,

          projectName: "$_id",

          totalQuantity: 1,
          totalAmount: 1,
          totalEntries: 1,

          inwardQty: 1,
          outwardQty: 1,

          totalMaterials: { $size: "$materials" },
          totalVendors: { $size: "$vendors" },
        },
      },

      {
        $sort: { totalAmount: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Project Wise Material History Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch project wise material history",
    });
  }
};

// Material History Summary
exports.getMaterialHistorySummary = async (req, res) => {
  try {
    const { fromDate, toDate, project, challanType } = req.query;

    const match = {};

    if (project) match.projectName = project;
    if (challanType) match.typeOfTransit = challanType;

    if (fromDate || toDate) {
      match.documentDate = {};
      if (fromDate) match.documentDate.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        match.documentDate.$lte = endDate;
      }
    }

    const totalMaterialsUsed = await MaterialMovement.countDocuments(match);

    const moneySummary = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTransactionAmount: { $sum: { $ifNull: ["$amount", 0] } },
          totalTransactionCount: { $sum: 1 }
        }
      }
    ]);

    const quantityByUom = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            uom: { $ifNull: ["$uom", "NA"] }
          },
          totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
          totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const challanDocs = await MaterialMovement.aggregate([
      {
        $match: {
          ...match,
          typeOfTransit: { $in: ["DDC", "DC", "LPN", "MRN", "MRS"] },
          documentName: { $nin: ["", null] }
        }
      },
      {
        $group: {
          _id: "$documentName"
        }
      },
      {
        $count: "total"
      }
    ]);

    const totalChallans = challanDocs[0]?.total || 0;

    const activeSites = await MaterialMovement.distinct("projectName", match);
    const totalVendors = await MaterialMovement.distinct("vendorName", match);

    const topMaterials = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            itemName: "$itemName",
            uom: { $ifNull: ["$uom", "NA"] }
          },
          totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
          totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    const challanTypeSummary = await MaterialMovement.aggregate([
      {
        $match: {
          ...match,
          typeOfTransit: { $in: ["DDC", "DC", "LPN", "MRN", "MRS"] },
          documentName: { $nin: ["", null] }
        }
      },
      {
        $group: {
          _id: {
            typeOfTransit: "$typeOfTransit",
            documentName: "$documentName",
            uom: { $ifNull: ["$uom", "NA"] }
          },
          totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
          totalAmount: { $sum: { $ifNull: ["$amount", 0] } }
        }
      },
      {
        $group: {
          _id: {
            typeOfTransit: "$_id.typeOfTransit",
            uom: "$_id.uom"
          },
          challanCount: { $sum: 1 },
          totalQuantity: { $sum: "$totalQuantity" },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const topVendors = await MaterialMovement.aggregate([
      {
        $match: {
          ...match,
          vendorName: { $nin: ["", null] }
        }
      },
      {
        $group: {
          _id: "$vendorName",
          totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    const topSites = await MaterialMovement.aggregate([
      {
        $match: {
          ...match,
          projectName: { $nin: ["", null] }
        }
      },
      {
        $group: {
          _id: "$projectName",
          totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMaterialsUsed,
        totalChallans,

        totalTransactionAmount:
          moneySummary[0]?.totalTransactionAmount || 0,

        totalTransactionCount:
          moneySummary[0]?.totalTransactionCount || 0,

        activeSites: activeSites.filter(Boolean).length,
        totalVendors: totalVendors.filter(Boolean).length,

        quantityByUom,
        topMaterials,
        challanTypeSummary,
        topVendors,
        topSites
      }
    });
  } catch (error) {
    console.error("Material History Summary Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch material history summary"
    });
  }
};


//  Get Single Project Reports
exports.getSingleProjectMaterialHistory = async (req, res) => {
  try {
    const { projectName } = req.params;
    const decodedProjectName = decodeURIComponent(projectName);
    //  console.log("PROJECT NAME:"+decodedProjectName)
    const project = await ProjectMaster.findOne({
      name: projectName
    });

    const match = { projectName: decodedProjectName };

    const materialSummary = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$projectName",
          totalInQty: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["DDC", "DC", "LPN"]],
                },
                "$quantity",
                0,
              ],
            },
          },

          totalOutQty: {
            $sum: {
              $cond: [
                {
                  $in: ["$typeOfTransit", ["MRS", "MRN"]],
                },
                "$quantity",
                0,
              ],
            },
          },
          materialAmount: { $sum: "$amount" },
          materials: { $addToSet: "$itemName" },
          vendors: { $addToSet: "$vendorName" },
        },
      },
      {
        $project: {
          totalInQty: 1,
          totalOutQty: 1,
          materialAmount: 1,
          totalMaterials: { $size: "$materials" },
          totalVendors: { $size: "$vendors" },
        },
      },
    ]);

    const billSummary = await Bill.aggregate([
      {
        $match: {
          project: project?._id,
        },
      },
      {
        $group: {
          _id: "$billType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$billAmount" },
        },
      },
    ]);

    const totalBilledAmount = billSummary.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );

    const challanSummary = await MaterialMovement.aggregate([
      {
        $match: {
          ...match,
          documentName: { $ne: "" },
          typeOfTransit: { $in: ["DDC", "DC", "LPN", "MRN", "MRS"] },
        },
      },
      {
        $group: {
          _id: {
            typeOfTransit: "$typeOfTransit",
            documentName: "$documentName",
          },
          totalQty: { $sum: "$quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.typeOfTransit",
          count: { $sum: 1 },
          totalQty: { $sum: "$totalQty" },
        },
      },
    ]);

    const topMaterials = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$itemName",
          totalQty: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          uom: { $first: "$uom" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]);

    const categorySummary = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ["$category", ""] }, { $eq: ["$category", null] }] },
              "Uncategorized",
              "$category",
            ],
          },
          totalQty: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          itemCount: { $sum: 1 },
          uniqueItems: { $addToSet: "$itemName" },
        },
      },
      {
        $project: {
          category: "$_id",
          totalQty: 1,
          totalAmount: 1,
          itemCount: 1,
          uniqueItemCount: { $size: "$uniqueItems" },
          _id: 0,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);
    const recentMovements = await MaterialMovement.find(match)
      .sort({ documentDate: -1, createdAt: -1 })
      .limit(20);

    const workOrderValue = Number(
      (project?.orderAmount || "0")
    );
    // console.log(project)
    res.status(200).json({
      success: true,
      data: {
        projectOverview: {
          projectName: project?.name || decodedProjectName,
          projectCode: project?.code || "",
          workOrderValue,
          status: project?.status || "",
          totalBilledAmount,
          remainingAmount:
            workOrderValue - Number(totalBilledAmount || 0),
        },
        materialSummary: materialSummary[0] || {},
        billSummary,
        challanSummary,
        categorySummary,
        topMaterials,
        recentMovements,
      },
    });
  } catch (error) {
    console.error("Single Project Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch single project report",
    });
  }
};

// Get Item By Category 
exports.getProjectCategoryMaterialDetails = async (req, res) => {
  try {
    const { projectName, category } = req.params;

    const decodedProjectName = decodeURIComponent(projectName);
    const decodedCategory = decodeURIComponent(category);

    const match = {
      projectName: decodedProjectName,
      category: decodedCategory,
    };

    const records = await MaterialMovement.find(match)
      .sort({ documentDate: -1, createdAt: -1 })
      .limit(100)
      .lean();

    const summaryAgg = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalQty: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          uniqueItems: { $addToSet: "$itemName" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          totalQty: 1,
          totalAmount: 1,
          uniqueItemCount: { $size: "$uniqueItems" },
        },
      },
    ]);

    const highestRateItem = await MaterialMovement.findOne(match)
      .sort({ rate: -1 })
      .select("itemName rate uom vendorName documentName")
      .lean();

    const mostUsedItem = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$itemName",
          totalQty: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          uom: { $first: "$uom" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 1 },
    ]);

    const topConsumptionItems = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$itemName",
          totalQty: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          avgRate: { $avg: "$rate" },
          uom: { $first: "$uom" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
    ]);

    const uniqueItemCards = await MaterialMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$itemName",
          totalQty: { $sum: "$quantity" },
          totalAmount: { $sum: "$amount" },
          avgRate: { $avg: "$rate" },
          maxRate: { $max: "$rate" },
          minRate: { $min: "$rate" },
          uom: { $first: "$uom" },
          recordsCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          itemName: "$_id",
          totalQty: 1,
          totalAmount: 1,
          avgRate: 1,
          maxRate: 1,
          minRate: 1,
          uom: 1,
          recordsCount: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        category: decodedCategory,
        summary: summaryAgg[0] || {
          totalRecords: 0,
          totalQty: 0,
          totalAmount: 0,
          uniqueItemCount: 0,
        },
        highestRateItem,
        mostUsedItem: mostUsedItem[0] || null,
        topConsumptionItems,
        uniqueItemCards,
        records,
      },
    });
  } catch (error) {
    console.error("Project Category Material Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category material details",
    });
  }
};



exports.getProjectLiveStockReport = async (req, res) => {
  try {
    const PROJECT_IN_TYPES = ["DDC", "DC", "LPN"];
    const PROJECT_OUT_TYPES = ["MRS"];

    const data = await MaterialMovement.aggregate([
      {
        $match: {
          projectName: { $ne: "" },
          itemName: { $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            projectName: "$projectName",
            itemName: "$itemName",
            uom: "$uom",
          },

          inQty: {
            $sum: {
              $cond: [
                { $in: ["$typeOfTransit", PROJECT_IN_TYPES] },
                "$quantity",
                0,
              ],
            },
          },

          outQty: {
            $sum: {
              $cond: [
                { $in: ["$typeOfTransit", PROJECT_OUT_TYPES] },
                "$quantity",
                0,
              ],
            },
          },

          totalValue: { $sum: "$amount" },
          avgRate: { $avg: "$rate" },
          recordsCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          projectName: "$_id.projectName",
          itemName: "$_id.itemName",
          uom: "$_id.uom",
          inQty: 1,
          outQty: 1,
          availableQty: { $subtract: ["$inQty", "$outQty"] },
          totalValue: 1,
          avgRate: 1,
          recordsCount: 1,
        },
      },
      {
        $sort: {
          projectName: 1,
          availableQty: -1,
        },
      },
    ]);

    const projectSummary = await MaterialMovement.aggregate([
      {
        $match: {
          projectName: { $ne: "" },
          itemName: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$projectName",

          uniqueItems: { $addToSet: "$itemName" },

          totalInQty: {
            $sum: {
              $cond: [
                { $in: ["$typeOfTransit", PROJECT_IN_TYPES] },
                "$quantity",
                0,
              ],
            },
          },

          totalOutQty: {
            $sum: {
              $cond: [
                { $in: ["$typeOfTransit", PROJECT_OUT_TYPES] },
                "$quantity",
                0,
              ],
            },
          },

          totalValue: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          projectName: "$_id",
          totalUniqueItems: { $size: "$uniqueItems" },
          totalInQty: 1,
          totalOutQty: 1,
          availableQty: { $subtract: ["$totalInQty", "$totalOutQty"] },
          totalValue: 1,
        },
      },
      {
        $sort: {
          totalValue: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        projectSummary,
        itemWiseStock: data,
      },
    });
  } catch (error) {
    console.error("Project Live Stock Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project live stock report",
    });
  }
};


exports.getHeadStoreLiveStockReport = async (req, res) => {
  try {
    const HEAD_STORE_IN_TYPES = ["MRN", "MRS"];
    const HEAD_STORE_OUT_TYPES = ["DC"];

    const itemWiseStock = await MaterialMovement.aggregate([
      {
        $match: {
          itemName: { $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            itemName: "$itemName",
            uom: "$uom",
            
          },
      
      vendorInQty: {
        $sum: {
          $cond: [{ $eq: ["$typeOfTransit", "MRN"] }, "$quantity", 0],
        },
      },

      siteReturnQty: {
        $sum: {
          $cond: [{ $eq: ["$typeOfTransit", "MRS"] }, "$quantity", 0],
        },
      },

      storeOutQty: {
        $sum: {
          $cond: [{ $in: ["$typeOfTransit", HEAD_STORE_OUT_TYPES] }, "$quantity", 0],
        },
      },

      totalInQty: {
        $sum: {
          $cond: [{ $in: ["$typeOfTransit", HEAD_STORE_IN_TYPES] }, "$quantity", 0],
        },
      },

      totalAmount: { $sum: "$amount" },
      avgRate: { $avg: "$rate" },
      recordsCount: { $sum: 1 },
      sites: { $addToSet: "$projectName" },
      vendors: { $addToSet: "$vendorName" },
        },
},
{
  $project: {
    _id: 0,
    itemName: "$_id.itemName",
    uom: "$_id.uom",
    vendorInQty: 1,
    siteReturnQty: 1,
    storeOutQty: 1,
    totalInQty: 1,
    availableQty: { $subtract: ["$totalInQty", "$storeOutQty"] },
    totalAmount: 1,
    avgRate: 1,
    recordsCount: 1,
    totalSites: { $size: "$sites" },
    totalVendors: { $size: "$vendors" },
    availableStockValue: 1,
  },
},
  { $sort: { availableQty: -1 } },
    ]);

const summaryAgg = await MaterialMovement.aggregate([
  {
    $match: {
      itemName: { $ne: "" },
    },
  },
  {
    $group: {
      _id: null,

      uniqueItems: { $addToSet: "$itemName" },

      vendorInQty: {
        $sum: {
          $cond: [{ $eq: ["$typeOfTransit", "MRN"] }, "$quantity", 0],
        },
      },

      siteReturnQty: {
        $sum: {
          $cond: [{ $eq: ["$typeOfTransit", "MRS"] }, "$quantity", 0],
        },
      },

      storeOutQty: {
        $sum: {
          $cond: [{ $eq: ["$typeOfTransit", "DC"] }, "$quantity", 0],
        },
      },

      totalAmount: { $sum: "$amount" },
      stockValue:{$sum:0}
    },
  },
  {
    $project: {
      _id: 0,
      totalUniqueItems: { $size: "$uniqueItems" },
      vendorInQty: 1,
      siteReturnQty: 1,
      storeOutQty: 1,
      availableQty: {
        $subtract: [{ $add: ["$vendorInQty", "$siteReturnQty"] }, "$storeOutQty"],
      },
      totalAmount: 1,
    },
  },
]);

const returnFromSites = await MaterialMovement.aggregate([
  {
    $match: {
      typeOfTransit: "MRS",
      projectName: { $ne: "" },
    },
  },
  {
    $group: {
      _id: "$projectName",
      returnQty: { $sum: "$quantity" },
      returnValue: { $sum: "$amount" },
      uniqueItems: { $addToSet: "$itemName" },
    },
  },
  {
    $project: {
      _id: 0,
      projectName: "$_id",
      returnQty: 1,
      returnValue: 1,
      totalReturnedItems: { $size: "$uniqueItems" },
    },
  },
  { $sort: { returnQty: -1 } },
  { $limit: 10 },
]);

res.status(200).json({
  success: true,
  data: {
    summary: summaryAgg[0] || {
      totalUniqueItems: 0,
      vendorInQty: 0,
      siteReturnQty: 0,
      storeOutQty: 0,
      availableQty: 0,
      totalAmount: 0,
      stockValue:0,
      
    },
    itemWiseStock,
    returnFromSites,
  },
});
  } catch (error) {
  console.error("Head Store Live Stock Error:", error);
  res.status(500).json({
    success: false,
    message: "Failed to fetch head store live stock report",
  });
}
};
// Update Project Name Globally
exports.updateProjectNameGlobally = async (req, res) => {
  try {
    const { oldProjectName, newProjectName } = req.body;

    if (!oldProjectName || !newProjectName) {
      return res.status(400).json({
        success: false,
        message: "oldProjectName and newProjectName are required",
      });
    }

    // Update Material Movement
    const materialResult = await MaterialMovement.updateMany(
      {
        projectName: oldProjectName,
      },
      {
        $set: {
          projectName: newProjectName,
        },
      }
    );



    return res.status(200).json({
      success: true,
      message: "Project name updated successfully",

      updated: {
        materialMovementRecords: materialResult.modifiedCount,
      },
    });
  } catch (error) {
    console.log("Update Project Name Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};