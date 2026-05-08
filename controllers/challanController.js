const Challan = require("../model/Challan");

const generateChallanNumber = async () => {
  const count = await Challan.countDocuments();
  return `DC-${String(count + 1).padStart(5, "0")}`;
};

exports.createChallan = async (req, res) => {
  try {
    const {
      projectName,
      projectId,
      site,
      dispatchFrom,
      dispatchTo,
      vendorName,
      dispatchDate,
      deliveryStatus,
      items,
      vehicleNumber,
      transporterName,
      sentBy,
      remarks,
    } = req.body;

    if (!projectName) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    const challanNumber = await generateChallanNumber();

    const challan = await Challan.create({
      challanNumber,
      projectName,
      projectId: projectId || null,
      site,
      dispatchFrom,
      dispatchTo,
      vendorName,
      dispatchDate,
      deliveryStatus: deliveryStatus || "Pending",
      items: parsedItems,
      vehicleNumber,
      transporterName,
      sentBy,
      remarks,
        });

    res.status(201).json({
      success: true,
      message: "Challan created successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Create Challan Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create challan",
      error: error.message,
    });
  }
};

exports.getAllChallans = async (req, res) => {
  try {
    const challans = await Challan.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: challans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch challans",
      error: error.message,
    });
  }
};

exports.updateChallan = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (updateData.items && typeof updateData.items === "string") {
      updateData.items = JSON.parse(updateData.items);
    }

    if (req.file?.path) {
      updateData.signedChallanFile = req.file.path;
    }

    const challan = await Challan.findById(id);

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    Object.assign(challan, updateData);
    await challan.save();

    res.status(200).json({
      success: true,
      message: "Challan updated successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Update Challan Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update challan",
      error: error.message,
    });
  }
};