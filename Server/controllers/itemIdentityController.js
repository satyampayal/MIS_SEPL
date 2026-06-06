const ItemIdentity = require("../model/ItemIdentity");
const XLSX = require("xlsx");

const cleanString = (value = "") => String(value || "").trim();
const cleanNumber = (value = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

exports.createItemIdentity = async (req, res) => {
  try {
    const itemCode = cleanString(req.body.itemCode).toUpperCase();

    const exists = await ItemIdentity.findOne({ itemCode });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Item code already exists",
      });
    }

    const item = await ItemIdentity.create({
      ...req.body,
      itemName: cleanString(req.body.itemName).toUpperCase(),
      itemCode,
      itemImage: req.file ? req.file.path : "",
      createdBy: req.user?._id || null,
    });

    res.status(201).json({
      success: true,
      message: "Item identity created successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create item identity",
      error: error.message,
    });
  }
};

exports.getAllItemIdentities = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      page = 1,
      limit ,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {};

    if (status === "Inactive") {
      query.isActive = false;
    } else {
      query.isActive = true;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
        { hsnCode: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { specification: { $regex: search, $options: "i" } },
      ];
    }

    const totalItems=(await ItemIdentity.find()).length;
    const totalRecords = await ItemIdentity.countDocuments(query);

    const items = await ItemIdentity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: items.length,
   

      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
        totalRecords,
        limit: limitNumber,
      },

      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch item identities",
      error: error.message,
    });
  }
};

exports.getSingleItemIdentity = async (req, res) => {
  try {
    const item = await ItemIdentity.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch item identity",
      error: error.message,
    });
  }
};

exports.updateItemIdentity = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.itemName) {
      updateData.itemName = cleanString(updateData.itemName).toUpperCase();
    }

    if (updateData.itemCode) {
      updateData.itemCode = cleanString(updateData.itemCode).toUpperCase();

      const exists = await ItemIdentity.findOne({
        itemCode: updateData.itemCode,
        _id: { $ne: req.params.id },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Item code already exists",
        });
      }
    }

    if (req.file) updateData.itemImage = req.file.path;

    updateData.updatedBy = req.user?._id || null;

    const item = await ItemIdentity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item identity updated successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update item identity",
      error: error.message,
    });
  }
};

exports.deleteItemIdentity = async (req, res) => {
  try {
    const item = await ItemIdentity.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    item.isActive = false;
    item.updatedBy = req.user?._id || null;
    await item.save();

    res.status(200).json({
      success: true,
      message: "Item identity deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete item identity",
      error: error.message,
    });
  }
};

exports.bulkUploadItemIdentities = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

   const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const insertedItems = [];
    const skippedItems = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const itemName = cleanString(row.itemName || row["Item Name"]).toUpperCase();
      const itemCode = cleanString(row.itemCode || row["Item Code"]).toUpperCase();

      if (!itemName || !itemCode) {
        skippedItems.push({
          row: i + 2,
          reason: "Item Name and Item Code are required",
          data: row,
        });
        continue;
      }

      const exists = await ItemIdentity.findOne({ itemCode });

      if (exists) {
        skippedItems.push({
          row: i + 2,
          itemName,
          itemCode,
          reason: "Duplicate item code",
        });
        continue;
      }

      const item = await ItemIdentity.create({
        itemName,
        itemCode,
        category: cleanString(row.category || row["Category"]),
        subCategory: cleanString(row.subCategory || row["Sub Category"]),
        unit: cleanString(row.unit || row["Unit"]) || "Nos",
        hsnCode: cleanString(row.hsnCode || row["HSN Code"]),
        description: cleanString(row.description || row["Description"]),
        specification: cleanString(row.specification || row["Specification"]),
        brand: cleanString(row.brand || row["Brand"]),
        make: cleanString(row.make || row["Make"]),
        gstPercentage: cleanNumber(row.gstPercentage || row["GST Percentage"]),
        minimumStockLevel: cleanNumber(row.minimumStockLevel || row["Minimum Stock Level"]),
        reorderLevel: cleanNumber(row.reorderLevel || row["Reorder Level"]),
        remarks: cleanString(row.remarks || row["Remarks"]),
        createdBy: req.user?._id || null,
      });

      insertedItems.push(item);
    }

    res.status(201).json({
      success: true,
      message: "Bulk item identities uploaded successfully",
      insertedCount: insertedItems.length,
      skippedCount: skippedItems.length,
      insertedItems,
      skippedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload item identities",
      error: error.message,
    });
  }
};