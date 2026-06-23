const DailyProgressReport = require("../model/DailyProgressReportSchema");
const Project = require("../model/Project");
const Contractor = require("../model/Contractor");

const cleanText = (value) => String(value || "").trim();

const toNumber = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const generateDPRNumber = async (projectRef, reportDate) => {
  const year = new Date(reportDate).getFullYear();

  const count = await DailyProgressReport.countDocuments({
    projectRef,
    reportDate: {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    },
  });

  return `DPR/${year}/${String(count + 1).padStart(4, "0")}`;
};

exports.createDPR = async (req, res) => {
  try {
    const {
      projectRef,
      contractorRef,
      reportDate,
      siteInchargeName,
      weather,
      manpowerDetails = [],
      workDoneToday,
      materialReceived = [],
      materialUsed = [],
      visitors,
      remarks,
      status,
    } = req.body;

    if (!projectRef) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    if (!reportDate) {
      return res.status(400).json({
        success: false,
        message: "Report date is required",
      });
    }

    if (!cleanText(workDoneToday)) {
      return res.status(400).json({
        success: false,
        message: "Work done today is required",
      });
    }

    const project = await Project.findById(projectRef);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    let contractor = null;

    if (contractorRef) {
      contractor = await Contractor.findById(contractorRef);
    }

    const safeManpower = manpowerDetails
      .map((m) => ({
        role: cleanText(m.role),
        count: toNumber(m.count),
      }))
      .filter((m) => m.role || m.count > 0);

    const manpowerCount = safeManpower.reduce(
      (sum, m) => sum + Number(m.count || 0),
      0
    );

    const normalizeMaterial = (items = []) =>
      items
        .map((item) => ({
          itemRef: item.itemRef || null,
          itemName: cleanText(item.itemName),
          itemCode: cleanText(item.itemCode),
          uom: cleanText(item.uom),
          quantity: toNumber(item.quantity),
          source: item.source || "OTHER",
          remarks: cleanText(item.remarks),
        }))
        .filter((item) => item.itemName && item.quantity > 0);

    const dprNumber = await generateDPRNumber(projectRef, reportDate);

    const dpr = await DailyProgressReport.create({
      dprNumber,

      projectRef,
      projectName: project.name || project.projectName || "",

      contractorRef: contractor?._id || null,
      contractorName:
        contractor?.contractorName || contractor?.name || "",

      reportDate,
      siteInchargeName: cleanText(siteInchargeName),
      weather: weather || "CLEAR",

      manpowerCount,
      manpowerDetails: safeManpower,

      workDoneToday: cleanText(workDoneToday),

      materialReceived: normalizeMaterial(materialReceived),
      materialUsed: normalizeMaterial(materialUsed),

      visitors: cleanText(visitors),
      remarks: cleanText(remarks),

      status: status || "SUBMITTED",

      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "DPR created successfully",
      dpr,
    });
  } catch (error) {
    console.error("Create DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create DPR",
      error: error.message,
    });
  }
};


exports.getAllDPR = async (req, res) => {
  try {
    const { projectRef, fromDate, toDate, search } = req.query;

    const filter = {};

    if (projectRef) {
      filter.projectRef = projectRef;
    }

    if (fromDate || toDate) {
      filter.reportDate = {};

      if (fromDate) {
        filter.reportDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.reportDate.$lte = new Date(toDate);
      }
    }

    if (search) {
      filter.$or = [
        {
          projectName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          siteInchargeName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const dprs = await DailyProgressReport.find(filter)
      .sort({ reportDate: -1 })
      .populate("projectRef", "name code")
      .populate("createdBy", "name");

    return res.status(200).json({
      success: true,
      count: dprs.length,
      dprs,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch DPRs",
    });
  }
};


exports.getSingleDPR = async (req, res) => {
  try {
    const dpr = await DailyProgressReport.findById(req.params.id)
      .populate("projectRef")
      .populate("createdBy", "name");

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found",
      });
    }

    return res.status(200).json({
      success: true,
      dpr,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch DPR",
    });
  }
};


exports.updateDPR = async (req, res) => {
  try {
    const dpr = await DailyProgressReport.findById(req.params.id);

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found",
      });
    }

    Object.assign(dpr, req.body);

    dpr.updatedBy = req.user._id;

    await dpr.save();

    return res.status(200).json({
      success: true,
      message: "DPR updated successfully",
      dpr,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update DPR",
    });
  }
};


exports.deleteDPR = async (req, res) => {
  try {
    const dpr = await DailyProgressReport.findById(req.params.id);

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found",
      });
    }

    await dpr.deleteOne();

    return res.status(200).json({
      success: true,
      message: "DPR deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete DPR",
    });
  }
};


exports.verifyDPR = async (req, res) => {
  try {
    const dpr = await DailyProgressReport.findById(req.params.id);

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found",
      });
    }

    dpr.status = "VERIFIED";
    dpr.verifiedBy = req.user?._id || null;
    dpr.verifiedAt = new Date();
    dpr.rejectionReason = "";

    await dpr.save();

    return res.status(200).json({
      success: true,
      message: "DPR verified successfully",
      dpr,
    });
  } catch (error) {
    console.error("Verify DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify DPR",
      error: error.message,
    });
  }
};

exports.rejectDPR = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const dpr = await DailyProgressReport.findById(req.params.id);

    if (!dpr) {
      return res.status(404).json({
        success: false,
        message: "DPR not found",
      });
    }

    dpr.status = "REJECTED";
    dpr.rejectionReason = rejectionReason || "Rejected";
    dpr.verifiedBy = req.user?._id || null;
    dpr.verifiedAt = new Date();

    await dpr.save();

    return res.status(200).json({
      success: true,
      message: "DPR rejected successfully",
      dpr,
    });
  } catch (error) {
    console.error("Reject DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject DPR",
      error: error.message,
    });
  }
};