const StoreItem = require("../model/StoreItem");
const XLSX = require("xlsx");

exports.createStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.create({
      ...req.body,
      itemImage: req.file ? req.file.path : "",
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Store item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create Store Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create store item",
      error: error.message,
    });
  }
};

exports.getAllStoreItems = async (req, res) => {
  try {
    const { search, status, category } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
        { hsnCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    const items = await StoreItem.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Get Store Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store items",
      error: error.message,
    });
  }
};

exports.getSingleStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Store item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get Single Store Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store item",
      error: error.message,
    });
  }
};

exports.updateStoreItem = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.itemImage = req.file.path;
    }

    const item = await StoreItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Store item not found",
      });
    }

    Object.assign(item, updateData);
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Store item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Update Store Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store item",
      error: error.message,
    });
  }
};

exports.deleteStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Store item not found",
      });
    }

    item.isActive = false;
    item.status = "Inactive";
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Store item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Store Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete store item",
      error: error.message,
    });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type, remarks } = req.body;

    const item = await StoreItem.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Store item not found",
      });
    }

    const qty = Number(quantity || 0);

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (type === "IN") {
      item.currentStock = Number(item.currentStock || 0) + qty;
    } else if (type === "OUT") {
      if (qty > Number(item.currentStock || 0)) {
        return res.status(400).json({
          success: false,
          type: "STOCK_ERROR",
          itemId: item._id,
          itemName: item.itemName,
          availableQty: item.currentStock,
          enteredQty: qty,
          message: `${item.itemName} has only ${item.currentStock} ${item.unit} available`,
        });
      }

      item.currentStock = Number(item.currentStock || 0) - qty;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid stock update type",
      });
    }

    if (remarks) {
      item.remarks = remarks;
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Update Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
};

exports.getAvailableItemsForChallan = async (req, res) => {
  try {
    const items = await StoreItem.find({
      isActive: true,
      currentStock: { $gt: 0 },
    })
      .select(
        "itemName itemCode description hsnCode boqNo unit rate currentStock minimumStock status category"
      )
      .sort({ itemName: 1 });

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get Available Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available items",
      error: error.message,
    });
  }
};


exports.bulkUploadStoreItems = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    const insertedItems = [];
    const skippedItems = [];

    for (const row of rows) {
      const itemName = String(row.itemName || row["Item Name"] || "").trim();
      const itemCode = String(row.itemCode || row["Item Code"] || "").trim();

      if (!itemName || !itemCode) {
        skippedItems.push({
          row,
          reason: "Item Name and Item Code are required",
        });
        continue;
      }

      const exists = await StoreItem.findOne({ itemCode });

      if (exists) {
        skippedItems.push({
          itemName,
          itemCode,
          reason: "Duplicate item code",
        });
        continue;
      }

      const openingStock = Number(row.openingStock || row["Opening Stock"] || 0);
      const currentStock = Number(row.currentStock || row["Current Stock"] || openingStock);

      const item = await StoreItem.create({
        itemName,
        itemCode,

        category: row.category || row["Category"] || "",
        subCategory: row.subCategory || row["Sub Category"] || "",
        description: row.description || row["Description"] || "",

        hsnCode: row.hsnCode || row["HSN Code"] || "",
        boqNo: row.boqNo || row["BOQ No"] || "",

        unit: row.unit || row["Unit"] || "Nos",

        openingStock,
        currentStock,

        minimumStock: Number(row.minimumStock || row["Minimum Stock"] || 0),
        maximumStock: Number(row.maximumStock || row["Maximum Stock"] || 0),
        reorderLevel: Number(row.reorderLevel || row["Reorder Level"] || 0),

        rate: Number(row.rate || row["Rate"] || 0),
        averagePurchaseRate: Number(
          row.averagePurchaseRate || row["Average Purchase Rate"] || 0
        ),
        lastPurchaseRate: Number(
          row.lastPurchaseRate || row["Last Purchase Rate"] || 0
        ),

        location: row.location || row["Location"] || "",
        rackNumber: row.rackNumber || row["Rack Number"] || "",

        brand: row.brand || row["Brand"] || "",
        make: row.make || row["Make"] || "",
        supplierName: row.supplierName || row["Supplier Name"] || "",

        gstPercentage: Number(row.gstPercentage || row["GST Percentage"] || 0),

        remarks: row.remarks || row["Remarks"] || "",

        createdBy: req.user?._id || null,
      });

      insertedItems.push(item);
    }

    return res.status(201).json({
      success: true,
      message: "Bulk items uploaded successfully",
      insertedCount: insertedItems.length,
      skippedCount: skippedItems.length,
      insertedItems,
      skippedItems,
    });
  } catch (error) {
    console.error("Bulk Upload Store Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload bulk items",
      error: error.message,
    });
  }
};