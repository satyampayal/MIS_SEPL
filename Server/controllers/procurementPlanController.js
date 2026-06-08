const ProcurementPlan = require("../model/ProcurementPlan");
const MaterialRequisition = require("../model/MaterialRequisition");

const generateProcurementNumber = async () => {
  const count = await ProcurementPlan.countDocuments();
  return `PRP-${String(count + 1).padStart(5, "0")}`;
};

exports.createProcurementPlan = async (req, res) => {
  try {
    const { materialRequisitionRef, projectRef, items } = req.body;

    if (!materialRequisitionRef) {
      return res.status(400).json({
        success: false,
        message: "Material requisition is required",
      });
    }

    if (!projectRef) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one procurement item is required",
      });
    }

    const finalItems = items
      .filter((item) => Number(item.shortageQty || 0) > 0)
      .map((item) => ({
        itemRef: item.itemRef,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        requiredQty: Number(item.requiredQty || 0),
        availableQty: Number(item.availableQty || 0),
        shortageQty: Number(item.shortageQty || 0),
        procurementMode: item.procurementMode || "MRN",
        suggestedVendor: item.suggestedVendor || "",
        lastPurchaseRate: Number(item.lastPurchaseRate || 0),
        remarks: item.remarks || "",
      }));

    if (finalItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No shortage item found for procurement",
      });
    }

    const plan = await ProcurementPlan.create({
      procurementNumber: await generateProcurementNumber(),
      materialRequisitionRef,
      projectRef,
      items: finalItems,
      createdBy: req.user?._id || req.user?.id || null,
    });

    await MaterialRequisition.findByIdAndUpdate(materialRequisitionRef, {
      $set: {
        procurementPlanCreated: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Procurement plan created successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create procurement plan",
      error: error.message,
    });
  }
};

exports.getAllProcurementPlans = async (req, res) => {
  try {
    const { status, projectRef, search } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (projectRef) filter.projectRef = projectRef;

    if (search) {
      filter.$or = [
        { procurementNumber: { $regex: search, $options: "i" } },
        { "items.itemName": { $regex: search, $options: "i" } },
        { "items.itemCode": { $regex: search, $options: "i" } },
      ];
    }

    const plans = await ProcurementPlan.find(filter)
      .populate("materialRequisitionRef", "requisitionNumber status")
      .populate("projectRef", "projectName name projectCode")
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch procurement plans",
      error: error.message,
    });
  }
};

exports.getProcurementPlanById = async (req, res) => {
  try {
    const plan = await ProcurementPlan.findById(req.params.id)
      .populate("materialRequisitionRef", "requisitionNumber status")
      .populate("projectRef", "projectName name projectCode")
      .populate("items.itemRef")
      .populate("createdBy", "fullName email role");

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Procurement plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch procurement plan",
      error: error.message,
    });
  }
};

exports.updateProcurementItemMode = async (req, res) => {
  try {
    const { planId, itemId } = req.params;
    const { procurementMode } = req.body;

    const allowedModes = ["MRN", "DDC", "LPN", "ISTN"];

    if (!allowedModes.includes(procurementMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid procurement mode",
      });
    }

    const plan = await ProcurementPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Procurement plan not found",
      });
    }

    const item = plan.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Procurement item not found",
      });
    }

    item.procurementMode = procurementMode;

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Procurement mode updated",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update procurement mode",
      error: error.message,
    });
  }
};