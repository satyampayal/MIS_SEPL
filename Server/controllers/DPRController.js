const DailyProgressReport = require("../model/DailyProgressReportSchema");

/**
 * CREATE DPR
 */
exports.createDPR = async (req, res) => {
  try {
    const {
      projectId,
      projectName,
      reportDate,
      workDoneToday,
      manpowerCount,
      materialReceived,
      materialUsed,
      issuesFaced,
      tomorrowPlan,
      siteInchargeName,
      remarks
    } = req.body;

    if (!projectName || !reportDate || !workDoneToday) {
      return res.status(400).json({
        success: false,
        message: "Project name, report date and work done today are required"
      });
    }

    const photos =
      req.files?.map((file) => ({
        url: file.path,
        publicId: file.filename
      })) || [];

    const dpr = await DailyProgressReport.create({
      projectId: projectId || null,
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
      photos,
      createdBy: req.user?._id || null
    });

    return res.status(201).json({
      success: true,
      message: "DPR created successfully",
      dpr
    });
  } catch (error) {
    console.log("Create DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating DPR",
      error: error.message
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
    //   .populate("createdBy", "name email")
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
    const id=dprId;

    const dpr = await DailyProgressReport.findById(id)
      .populate("projectId")
      .populate("createdBy", "name email");

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
      .populate("createdBy", "name email")
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
    const id=dprId;

    const existingDPR = await DailyProgressReport.findById(id);

    if (!existingDPR) {
      return res.status(404).json({
        success: false,
        message: "DPR not found"
      });
    }

    const newPhotos =
      req.files?.map((file) => ({
        url: file.path,
        publicId: file.filename
      })) || [];

    const updatedData = {
      ...req.body
    };

    if (newPhotos.length > 0) {
      updatedData.photos = [...existingDPR.photos, ...newPhotos];
    }

    const updatedDPR = await DailyProgressReport.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "DPR updated successfully",
      dpr: updatedDPR
    });
  } catch (error) {
    console.log("Update DPR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating DPR",
      error: error.message
    });
  }
};

/**
 * DELETE DPR
 */
exports.deleteDPR = async (req, res) => {
  try {
     const { dprId } = req.params;
    const id=dprId;

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