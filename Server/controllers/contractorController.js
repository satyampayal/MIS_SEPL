const Contractor = require("../model/Contractor");

exports.createContractor = async (req, res) => {
  try {
    const {
      contractorName,
      contractorCode,
      contactPerson,
      mobile,
      email,
      gstNumber,
      panNumber,
      address,
      workTypes,
      remarks,
    } = req.body;

    if (!contractorName) {
      return res.status(400).json({
        success: false,
        message: "Contractor name is required",
      });
    }

    const contractor = await Contractor.create({
      contractorName,
      contractorCode: contractorCode || "",
      contactPerson: contactPerson || "",
      mobile: mobile || "",
      email: email || "",
      gstNumber: gstNumber || "",
      panNumber: panNumber || "",
      address: address || "",
      workTypes: Array.isArray(workTypes) ? workTypes : [],
      remarks: remarks || "",
    });

    return res.status(201).json({
      success: true,
      message: "Contractor created successfully",
      contractor,
    });
  } catch (error) {
    console.error("Create Contractor Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create contractor",
      error: error.message,
    });
  }
};

exports.getAllContractors = async (req, res) => {
  try {
    const { search = "", status } = req.query;

    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { contractorName: { $regex: search, $options: "i" } },
        { contractorCode: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
      ];
    }

    const contractors = await Contractor.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contractors.length,
      contractors,
    });
  } catch (error) {
    console.error("Get Contractors Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contractors",
      error: error.message,
    });
  }
};

exports.updateContractor = async (req, res) => {
  try {
    const { id } = req.params;

    const contractor = await Contractor.findById(id);

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found",
      });
    }

    const fields = [
      "contractorName",
      "contractorCode",
      "contactPerson",
      "mobile",
      "email",
      "gstNumber",
      "panNumber",
      "address",
      "workTypes",
      "status",
      "remarks",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        contractor[field] = req.body[field];
      }
    });

    await contractor.save();

    return res.status(200).json({
      success: true,
      message: "Contractor updated successfully",
      contractor,
    });
  } catch (error) {
    console.error("Update Contractor Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update contractor",
      error: error.message,
    });
  }
};

exports.deleteContractor = async (req, res) => {
  try {
    const { id } = req.params;

    const contractor = await Contractor.findById(id);

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found",
      });
    }

    contractor.status = "INACTIVE";
    await contractor.save();

    return res.status(200).json({
      success: true,
      message: "Contractor marked inactive successfully",
    });
  } catch (error) {
    console.error("Delete Contractor Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete contractor",
      error: error.message,
    });
  }
};