const XLSX = require("xlsx");
const MaterialMovement = require("../model/materialMovement");

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
      itemName,
      projectName,
      vendorName,
      documentNo,
      invoiceNumber,
      inOut,
      fromDate,
      toDate,
    } = req.query;

    const filter = {};

    if (itemName) {
      filter.itemName = { $regex: itemName.trim(), $options: "i" };
    }

    if (projectName) {
      filter.projectName = { $regex: projectName.trim(), $options: "i" };
    }

    if (vendorName) {
      filter.vendorName = { $regex: vendorName.trim(), $options: "i" };
    }

    if (documentNo) {
      filter.documentNo = { $regex: documentNo.trim(), $options: "i" };
    }

    if (invoiceNumber) {
      filter.invoiceNumber = { $regex: invoiceNumber.trim(), $options: "i" };
    }

    if (inOut) {
      filter.inOut = inOut;
    }

    if (fromDate || toDate) {
      filter.documentDate = {};
      if (fromDate) filter.documentDate.$gte = new Date(fromDate);
      if (toDate) filter.documentDate.$lte = new Date(toDate);
    }

    const data = await MaterialMovement.find(filter)
      .sort({ documentDate: -1, createdAt: -1 })
      .limit(500);

    const summary = await MaterialMovement.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: null,

          totalRecords: {
            $sum: 1
          },

          totalQuantity: {
            $sum: "$quantity"
          },

          totalAmount: {
            $sum: "$amount"
          }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      count: data.length,
      summary: summary[0] || {
        totalRecords: 0,
        totalQuantity: 0,
        totalAmount: 0
      },
      data,
    });
  } catch (error) {
    console.log("Material History Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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