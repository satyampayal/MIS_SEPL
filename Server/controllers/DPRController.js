const DailyProgressReport = require("../model/DailyProgressReportSchema");
const BOQItem = require('../model/boqItem')


const parseWorkItems = (workItems) => {
  if (!workItems) return [];

  let items = workItems;

  if (typeof workItems === "string") {
    items = JSON.parse(workItems);
  }

  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const todayQty = Number(item.todayQty) || 0;
    const rate = Number(item.rate) || 0;

    return {
      boqItemRef: item.boqItemRef || null,
      boqItemCode: item.boqItemCode || "",
      generalName: item.generalName || "",
      description: item.description || "",
      uom: item.uom || "",
      todayQty,
      rate,
      amount: todayQty * rate,
      workType: item.workType || "INSTALLATION",
      remarks: item.remarks || "",
    };
  });
};
/**
 * CREATE DPR
 */
exports.createDPR = async (req, res) => {
  try {
    const {
      projectId,
      contractorRef,
      projectName,
      reportDate,
      workDoneToday,
      manpowerCount,
      materialReceived,
      materialUsed,
      issuesFaced,
      tomorrowPlan,
      siteInchargeName,
      remarks,
      workItems,
    } = req.body;

    if (!projectName || !reportDate) {
      return res.status(400).json({
        success: false,
        message: "Project name and report date are required",
      });
    }

    const photos =
      req.files?.map((file) => ({
        url: file.path,
        publicId: file.filename,
      })) || [];

    const finalWorkItems = parseWorkItems(workItems);

    const dpr = await DailyProgressReport.create({
      projectId: projectId || null,
      contractorRef: contractorRef || null,
      projectName,
      reportDate,
      workDoneToday: workDoneToday || "",
      manpowerCount,
      materialReceived,
      materialUsed,
      issuesFaced,
      tomorrowPlan,
      siteInchargeName,
      remarks,
      workItems: finalWorkItems,
      photos,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "DPR created successfully",
      dpr,
    });
  } catch (error) {
    console.log("Create DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating DPR",
      error: error.message,
    });
  }
};
/**
 * GET ALL DPR
 */
exports.getAllDPR = async (req, res) => {
  try {
    const reports = await DailyProgressReport.find()
      .populate("projectId")
      // .populate("contractorRef", "contractorName contactPerson mobile")
      .populate("workItems.boqItemRef")
      // .populate("createdBy", "fullName email")
      .sort({ reportDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: reports.length,
      reports
    });
  } catch (error) {
    console.log("Get All DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching DPR",
      error: error.message
    });
  }
};

/**
 * GET PARTICULAR DPR BY ID
 */
exports.getParticularDPR = async (req, res) => {
  try {
    const { dprId } = req.params;
    const id = dprId;

    const dpr = await DailyProgressReport.findById(id)
      .populate("projectId")
      .populate("contractorRef", "contractorName contactPerson mobile")
      .populate("workItems.boqItemRef")
      .populate("createdBy", "fullName email");

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found"
      });
    }

    return res.status(200).json({
      success: true,
      dpr
    });
  } catch (error) {
    console.log("Get Particular DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching particular DPR",
      error: error.message
    });
  }
};

/**
 * GET DPR BY PROJECT ID
 */
exports.getDPRByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    const reports = await DailyProgressReport.find({ projectId })
      .populate("projectId")
      .populate("createdBy", "fullName email")
      .populate("contractorRef", "contractorName contactPerson mobile")
      .populate("workItems.boqItemRef")
      .sort({ reportDate: -1 });

    return res.status(200).json({
      success: true,
      total: reports.length,
      reports
    });
  } catch (error) {
    console.log("Get DPR By Project Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching project DPR",
      error: error.message
    });
  }
};

/**
 * UPDATE DPR
 */
exports.updateDPR = async (req, res) => {
  try {
    const { dprId } = req.params;

    const existingDPR = await DailyProgressReport.findById(dprId);

    if (!existingDPR) {
      return res.status(404).json({
        success: false,
        message: "DPR not found",
      });
    }

    const newPhotos =
      req.files?.map((file) => ({
        url: file.path,
        publicId: file.filename,
      })) || [];

    const updatedData = {
      ...req.body,
    };

    if (req.body.workItems !== undefined) {
      updatedData.workItems = parseWorkItems(req.body.workItems);
    }

    if (newPhotos.length > 0) {
      updatedData.photos = [...existingDPR.photos, ...newPhotos];
    }

    const updatedDPR = await DailyProgressReport.findByIdAndUpdate(
      dprId,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate("projectId")
      .populate("contractorRef", "contractorName contactPerson mobile")
      .populate("workItems.boqItemRef");

    return res.status(200).json({
      success: true,
      message: "DPR updated successfully",
      dpr: updatedDPR,
    });
  } catch (error) {
    console.log("Update DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating DPR",
      error: error.message,
    });
  }
};

/**
 * DELETE DPR
 */
exports.deleteDPR = async (req, res) => {
  try {
    const { dprId } = req.params;
    const id = dprId;

    const dpr = await DailyProgressReport.findById(id);

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found"
      });
    }

    await DailyProgressReport.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "DPR deleted successfully"
    });
  } catch (error) {
    console.log("Delete DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting DPR",
      error: error.message
    });
  }
};

/**
 * FILTER DPR
 */
exports.filterDPR = async (req, res) => {
  try {
    const { search, fromDate, toDate, projectName } = req.query;

    const query = {};

    if (projectName) {
      query.projectName = { $regex: projectName, $options: "i" };
    }

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { workDoneToday: { $regex: search, $options: "i" } },
        { siteInchargeName: { $regex: search, $options: "i" } },
        { issuesFaced: { $regex: search, $options: "i" } }
      ];
    }

    if (fromDate || toDate) {
      query.reportDate = {};

      if (fromDate) {
        query.reportDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        query.reportDate.$lte = new Date(toDate);
      }
    }

    const reports = await DailyProgressReport.find(query).sort({
      reportDate: -1
    });

    return res.status(200).json({
      success: true,
      total: reports.length,
      reports
    });
  } catch (error) {
    console.log("Filter DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while filtering DPR",
      error: error.message
    });
  }
};

// Get Monthly Dpr
exports.getMonthlyContractorReport = async (req, res) => {
  try {
    const { projectId, contractorRef, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);

    const endDate = new Date(year, month, 0, 23, 59, 59);

    const reports = await DailyProgressReport.find({
      projectId,
      contractorRef,
      reportDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    let totalAmount = 0;
    let totalQty = 0;

    const boqSummary = {};

    reports.forEach((report) => {
      report.workItems.forEach((item) => {
        totalAmount += Number(item.amount || 0);
        totalQty += Number(item.todayQty || 0);

        const key =
          item.generalName || item.description || "Unknown Item";

        if (!boqSummary[key]) {
          boqSummary[key] = {
            generalName: item.generalName,
            description: item.description,
            uom: item.uom,
            totalQty: 0,
            totalAmount: 0,
          };
        }

        boqSummary[key].totalQty += Number(item.todayQty || 0);
        boqSummary[key].totalAmount += Number(item.amount || 0);
      });
    });

    return res.status(200).json({
      success: true,
      totalDPR: reports.length,
      totalQty,
      totalAmount,
      boqSummary: Object.values(boqSummary),
    });
  } catch (error) {
    console.log("Monthly Contractor Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate contractor report",
      error: error.message,
    });
  }
};

// Monthly Project Report
exports.getMonthlyProjectReport = async (req, res) => {
  try {
    const { projectId, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);

    const endDate = new Date(year, month, 0, 23, 59, 59);

    const reports = await DailyProgressReport.find({
      projectId,
      reportDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    let totalAmount = 0;
    let totalQty = 0;
    let totalManpower = 0;

    reports.forEach((report) => {
      totalManpower += Number(report.manpowerCount || 0);

      report.workItems.forEach((item) => {
        totalQty += Number(item.todayQty || 0);
        totalAmount += Number(item.amount || 0);
      });
    });

    return res.status(200).json({
      success: true,
      totalDPR: reports.length,
      totalQty,
      totalAmount,
      totalManpower,
      reports,
    });
  } catch (error) {
    console.log("Monthly Project Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate project report",
      error: error.message,
    });
  }
};


