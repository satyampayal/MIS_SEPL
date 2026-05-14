const Challan = require("../model/Challan");
const Project = require("../model/Project");
const  StoreItem=require('../model/StoreItem')

const generateChallanNumber = async () => {
  const count = await Challan.countDocuments();
  return `SEPL/P3/LPN-${count + 1}`;
};

const parseItems = (items) => {
  if (!items) return [];

  if (typeof items === "string") {
    return JSON.parse(items);
  }

  return items;
};

const validateAndReduceStock = async (items) => {
  for (const item of items) {
    if (!item.itemRef) continue;

    const storeItem = await StoreItem.findById(item.itemRef);

    if (!storeItem) {
      throw new Error(`${item.itemName} not found in store`);
    }

    const availableQty = Number(storeItem.currentStock || 0);
    const challanQty = Number(item.quantity || 0);

    if (availableQty <= 0) {
      throw new Error(`${storeItem.itemName} is out of stock`);
    }

    if (challanQty > availableQty) {
      throw new Error(
        `${storeItem.itemName} has only ${availableQty} ${storeItem.unit || ""} available`
      );
    }

    storeItem.currentStock = availableQty - challanQty;

    await storeItem.save();
  }
};
exports.createChallan = async (req, res) => {
  try {
    const {
      challanType,
      projectId,
      projectName,
      site,
      dispatchFromStoreRef,
      dispatchFrom,
      dispatchTo,
      vendorName,
      dispatchDate,
      transportationMode,
      transporterName,
      vehicleNumber,
      deliveryStatus,
      items,
      remarks,
      sentBy,
    } = req.body;
    if (!dispatchFromStoreRef) {
  return res.status(400).json({
    success: false,
    message: "Dispatch from store is required",
  });
}

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    if (!dispatchDate) {
      return res.status(400).json({
        success: false,
        message: "Dispatch date is required",
      });
    }

    const parsedItems = parseItems(items);

    if (!parsedItems.length) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }
    // Validate stock and reduce it 
    await validateAndReduceStock(parsedItems);

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const challanNumber = await generateChallanNumber();

    const challan = await Challan.create({
      challanNumber,

      challanType: challanType || "Delivery Challan",

      projectId,
      projectName: projectName || project.name,

      site: site || project.location || "",

       dispatchFromStoreRef, // ✅ add this

      consigneeDetails: {
        consigneeName: project.consigneeName || "",
        consigneeAddress: project.consigneeAddress || "",
        gstNumber: project.gstNumber || "",
        placeOfDelivery: project.placeOfDelivery || "",
      },

      dispatchFrom: dispatchFrom || "Office",
      dispatchTo: dispatchTo || "Project Site",

      vendorName: vendorName || "",

      dispatchDate,

      transportationMode: transportationMode || "",
      transporterName: transporterName || "",
      vehicleNumber: vehicleNumber || "",

      deliveryStatus: deliveryStatus || "Pending",

      items: parsedItems,

      remarks: remarks || "",
      sentBy: sentBy || "",

      signedChallanFile: req.file ? req.file.path : "",
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Challan created successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Create Challan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create challan",
      error: error.message || "Failed to create challan",
    });
  }
};

exports.getAllChallans = async (req, res) => {
  try {
    const challans = await Challan.find()
      .populate("projectId", "name code location clientName")
      .populate("dispatchFromStoreRef", "storeName storeCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: challans,
    });
  } catch (error) {
    console.error("Get Challans Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch challans",
      error: error.message,
    });
  }
};

exports.getSingleChallan = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findById(id).populate(
      "projectId",
      "name code location clientName consigneeName consigneeAddress gstNumber placeOfDelivery"
    ).populate("dispatchFromStoreRef", "storeName storeCode")
    ;

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error) {
    console.error("Get Single Challan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch challan",
      error: error.message,
    });
  }
};

exports.updateChallan = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findById(id);

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    const updateData = { ...req.body };

    if (updateData.items) {
      updateData.items = parseItems(updateData.items);
    }

    if (req.file) {
      updateData.signedChallanFile = req.file.path;
    }

    delete updateData.challanNumber;
    delete updateData.totalAmount;
    delete updateData.totalQuantity;
    delete updateData.createdBy;

    Object.assign(challan, updateData);

    await challan.save();

    return res.status(200).json({
      success: true,
      message: "Challan updated successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Update Challan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update challan",
      error: error.message,
    });
  }
};

exports.uploadSignedChallan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Signed challan file is required",
      });
    }

    const challan = await Challan.findByIdAndUpdate(
      id,
      {
        signedChallanFile: req.file.path,
        deliveryStatus: "Delivered",
      },
      { new: true }
    );

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Signed challan uploaded successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Upload Signed Challan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload signed challan",
      error: error.message,
    });
  }
};

exports.deleteChallan = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findByIdAndDelete(id);

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challan deleted successfully",
    });
  } catch (error) {
    console.error("Delete Challan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete challan",
      error: error.message,
    });
  }
};