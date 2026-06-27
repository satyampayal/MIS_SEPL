const BOQDailyPlan = require("../model/boqDailyPlanModel");

const recalculatePlan = (plan) => {
  let targetQtyTotal = 0;
  let doneQtyTotal = 0;
  let targetValueTotal = 0;
  let doneValueTotal = 0;

  plan.items.forEach((item) => {
    item.targetValue = Number(item.targetQty || 0) * Number(item.installationRate || 0);
    item.doneValue = Number(item.doneQty || 0) * Number(item.installationRate || 0);

    if (Number(item.doneQty || 0) <= 0) item.status = "PENDING";
    else if (Number(item.doneQty || 0) < Number(item.targetQty || 0)) item.status = "PARTIAL";
    else item.status = "DONE";

    targetQtyTotal += Number(item.targetQty || 0);
    doneQtyTotal += Number(item.doneQty || 0);
    targetValueTotal += Number(item.targetValue || 0);
    doneValueTotal += Number(item.doneValue || 0);
  });

  plan.targetQtyTotal = targetQtyTotal;
  plan.doneQtyTotal = doneQtyTotal;
  plan.targetValueTotal = targetValueTotal;
  plan.doneValueTotal = doneValueTotal;

  const doneItems = plan.items.filter((x) => x.status === "DONE").length;
  const partialItems = plan.items.filter((x) => x.status === "PARTIAL").length;

  if (plan.items.length && doneItems === plan.items.length) plan.status = "COMPLETED";
  else if (doneItems > 0 || partialItems > 0) plan.status = "PARTIAL";
  else plan.status = "OPEN";

  return plan;
};

exports.createOrUpdateDailyPlan = async (req, res) => {
  try {
    const { projectRef, boqRef, planDate, items } = req.body;

    if (!projectRef || !boqRef || !planDate) {
      return res.status(400).json({
        success: false,
        message: "Project, BOQ and plan date are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one plan item is required",
      });
    }

    let plan = await BOQDailyPlan.findOne({
      projectRef,
      boqRef,
      planDate: new Date(planDate),
    });

    if (!plan) {
      plan = new BOQDailyPlan({
        projectRef,
        boqRef,
        planDate: new Date(planDate),
        items: [],
        createdBy: req.user?._id,
      });
    }

    items.forEach((incoming) => {
      const existingItem = plan.items.find(
        (x) => String(x.boqItemRef) === String(incoming.boqItemRef)
      );

      const payload = {
        boqItemRef: incoming.boqItemRef,
        boqItemCode: incoming.boqItemCode || "",
        generalName: incoming.generalName || "",
        description: incoming.description || "",
        uom: incoming.uom || "",
        balanceQtyAtPlan: Number(incoming.balanceQtyAtPlan || 0),
        targetQty: Number(incoming.targetQty || 0),
        doneQty: Number(incoming.doneQty || 0),
        installationRate: Number(incoming.installationRate || 0),
        remarks: incoming.remarks || "",
      };

      if (existingItem) {
        Object.assign(existingItem, payload);
      } else {
        plan.items.push(payload);
      }
    });

    plan.updatedBy = req.user?._id;
    recalculatePlan(plan);

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Daily BOQ plan saved successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Create/Update BOQ Daily Plan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save daily BOQ plan",
      error: error.message,
    });
  }
};

exports.getDailyPlan = async (req, res) => {
  try {
    const { projectRef, boqRef, planDate } = req.query;

    const match = {};

    if (projectRef) match.projectRef = projectRef;
    if (boqRef) match.boqRef = boqRef;
    if (planDate) match.planDate = new Date(planDate);

    const plans = await BOQDailyPlan.find(match)
      .populate("projectRef", "name code endDate")
      .populate("boqRef", "boqName boqType")
      .sort({ planDate: -1 });

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get BOQ Daily Plan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily BOQ plan",
      error: error.message,
    });
  }
};

exports.updatePlanItemDoneQty = async (req, res) => {
  try {
    const { planId, itemId } = req.params;
    const { doneQty, remarks } = req.body;

    const plan = await BOQDailyPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Daily plan not found",
      });
    }

    const item = plan.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Plan item not found",
      });
    }

    item.doneQty = Number(doneQty || 0);
    if (remarks !== undefined) item.remarks = remarks;

    recalculatePlan(plan);

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Plan item updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Update Plan Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update plan item",
      error: error.message,
    });
  }
};

exports.removePlanItem = async (req, res) => {
  try {
    const { planId, itemId } = req.params;

    const plan = await BOQDailyPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Daily plan not found",
      });
    }

    plan.items.pull(itemId);

    recalculatePlan(plan);

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Plan item removed successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Remove Plan Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove plan item",
      error: error.message,
    });
  }
};


exports.getPlansReadyForMB = async (req, res) => {
  try {
    const { projectRef, planDate, boqRef } = req.query;

    const match = {};
    if (projectRef) match.projectRef = projectRef;
    if (boqRef) match.boqRef = boqRef;
    if (planDate) match.planDate = new Date(planDate);

    const plans = await BOQDailyPlan.find(match)
      .populate("projectRef", "name code")
      .populate("boqRef", "boqName boqType")
      .sort({ planDate: -1 });

    const readyPlans = plans
      .map((plan) => {
        const readyItems = plan.items.filter(
          (item) => Number(item.doneQty || 0) > 0 && !item.copiedToMB
        );

        return {
          _id: plan._id,
          projectRef: plan.projectRef,
          boqRef: plan.boqRef,
          planDate: plan.planDate,
          status: plan.status,
          targetQtyTotal: plan.targetQtyTotal,
          doneQtyTotal: plan.doneQtyTotal,
          targetValueTotal: plan.targetValueTotal,
          doneValueTotal: plan.doneValueTotal,
          items: readyItems,
        };
      })
      .filter((plan) => plan.items.length > 0);

    return res.status(200).json({
      success: true,
      data: readyPlans,
    });
  } catch (error) {
    console.error("Get Plans Ready For MB Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch plans ready for MB",
      error: error.message,
    });
  }
};

exports.markPlanItemsCopiedToMB = async (req, res) => {
  try {
    const { planId } = req.params;
    const { itemIds, mbRef } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Item ids are required",
      });
    }

    const plan = await BOQDailyPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Daily plan not found",
      });
    }

    plan.items.forEach((item) => {
      if (itemIds.includes(String(item._id))) {
        item.copiedToMB = true;
        item.mbRef = mbRef || null;
      }
    });

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Plan items marked as copied to MB",
      data: plan,
    });
  } catch (error) {
    console.error("Mark Plan Items Copied Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark plan items copied",
      error: error.message,
    });
  }
};