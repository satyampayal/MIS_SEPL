const MaterialRequisition = require("../model/MaterialRequisition");
const ItemIdentity = require("../model/ItemIdentity");
const MainStoreStock = require("../model/mainStoreStock");
const ExcelJS = require("exceljs");
const generateMRQNumber = async () => {
  const count = await MaterialRequisition.countDocuments();
  return `MRQ-${String(count + 1).padStart(5, "0")}`;
};

exports.createMaterialRequisition = async (req, res) => {
  try {
    const { projectRef, requiredDate, priority, purpose, items } = req.body;

    if (!projectRef) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    if (!requiredDate) {
      return res.status(400).json({
        success: false,
        message: "Required date is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    const finalItems = [];

    for (const row of items) {
      const item = await ItemIdentity.findById(row.itemRef);

      if (!item) continue;

      const stock = await MainStoreStock.findOne({
        itemRef: item._id,
      });

      const requiredQty = Number(row.requiredQty || 0);
      const availableQty = Number(stock?.availableStock || 0);
      const shortageQty = Math.max(requiredQty - availableQty, 0);

      let suggestedAction = "PURCHASE";

      if (availableQty >= requiredQty) {
        suggestedAction = "DC";
      } else if (availableQty > 0 && shortageQty > 0) {
        suggestedAction = "DC_AND_PURCHASE";
      }

      finalItems.push({
        itemRef: item._id,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        requiredQty,
        approvedQty: requiredQty,
        availableQty,
        shortageQty,
        suggestedAction,
        remarks: row.remarks || "",
      });
    }

    const requisition = await MaterialRequisition.create({
      requisitionNumber: await generateMRQNumber(),
      projectRef,
      requiredDate,
      priority: priority || "NORMAL",
      purpose,
      requestedBy: req.user?._id || req.user?.id || null,
      items: finalItems,
    });

    res.status(201).json({
      success: true,
      message: "Material requisition created successfully",
      data: requisition,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create material requisition",
      error: error.message,
    });
  }
};

exports.getAllMaterialRequisitions = async (req, res) => {
  try {
    const { status, projectRef, search } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (projectRef) filter.projectRef = projectRef;

    if (search) {
      filter.$or = [
        { requisitionNumber: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
        { "items.itemName": { $regex: search, $options: "i" } },
        { "items.itemCode": { $regex: search, $options: "i" } },
      ];
    }

    const requisitions = await MaterialRequisition.find(filter)
      .populate("projectRef", " name code")
      .populate("requestedBy", "fullName email role")
      .populate("approvedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requisitions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch material requisitions",
      error: error.message,
    });
  }
};

exports.getMaterialRequisitionById = async (req, res) => {
  try {
    const requisition = await MaterialRequisition.findById(req.params.id)
      .populate("projectRef", " name code")
      .populate("requestedBy", "fullName email role")
      .populate("approvedBy", "fullName email role")
      .populate("items.itemRef");

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Material requisition not found",
      });
    }

    res.status(200).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch material requisition",
      error: error.message,
    });
  }
};

exports.approveMaterialRequisition = async (req, res) => {
  try {
    const requisition = await MaterialRequisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Material requisition not found",
      });
    }

    requisition.status = "APPROVED";
    requisition.approvedBy = req.user?._id || req.user?.id || null;
    requisition.approvedAt = new Date();

    await requisition.save();

    res.status(200).json({
      success: true,
      message: "Material requisition approved",
      data: requisition,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Approval failed",
      error: error.message,
    });
  }
};

exports.rejectMaterialRequisition = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const requisition = await MaterialRequisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Material requisition not found",
      });
    }

    requisition.status = "REJECTED";
    requisition.rejectionReason = rejectionReason || "Rejected";

    await requisition.save();

    res.status(200).json({
      success: true,
      message: "Material requisition rejected",
      data: requisition,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reject failed",
      error: error.message,
    });
  }
};

// Excel format
exports.exportMRQExcel = async (req, res) => {
  try {
    const mrq = await MaterialRequisition.findById(req.params.id)
      .populate("projectRef");

    if (!mrq) {
      return res.status(404).json({
        success: false,
        message: "MRQ not found",
      });
    }

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("MRQ");

    sheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Item Name", key: "itemName", width: 40 },
      // { header: "Item Code", key: "itemCode", width: 20 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Required Qty", key: "requiredQty", width: 15 },
      { header: "Approved Qty", key: "approvedQty", width: 15 },
      { header: "Availbale Qty", key: "availableQty", width: 15 },
      { header: "Issued Qty", key: "issuedQty", width: 15 },
      { header: "Remarks", key: "remarks", width: 40 },
    ];

    mrq.items.forEach((item, index) => {
      sheet.addRow({
        sr: index + 1,
        itemName: item.itemName,
        // itemCode: item.itemCode,
        unit: item.unit,
        requiredQty: item.requiredQty,
        approvedQty: item.approvedQty || 0,
        availableQty:item?.availableQty ||0,
        issuedQty: item.issuedQty || 0,
        remarks: item.remarks || "",
      });
    });

    sheet.insertRow(1, [
      `MRQ Number : ${mrq.requisitionNumber}`,
    ]);

    sheet.insertRow(2, [
      `Project : ${
        mrq.projectRef?.projectName ||
        mrq.projectRef?.name ||
        ""
      }`,
    ]);

    sheet.insertRow(3, [
      `Status : ${mrq.status}`,
    ]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${mrq.requisitionNumber}.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};