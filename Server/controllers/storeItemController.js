const ItemIdentity = require("../model/ItemIdentity");
const MainStoreStock = require("../model/mainStoreStock");
const XLSX = require("xlsx");

/* ---------------- HELPERS ---------------- */

const cleanString = (value = "") => String(value || "").trim();

const cleanNumber = (value = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

/* ---------------- CREATE ITEM IDENTITY ---------------- */

exports.createStoreItem = async (req, res) => {
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

    return res.status(201).json({
      success: true,
      message: "Item identity created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create Item Identity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create item identity",
      error: error.message,
    });
  }
};

/* ---------------- GET ALL ITEM IDENTITIES ---------------- */

exports.getAllStoreItems = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    const query = {};

    if (status === "Active") query.isActive = true;
    else if (status === "Inactive") query.isActive = false;
    else query.isActive = true;

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

    const items = await ItemIdentity.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Get Item Identities Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch item identities",
      error: error.message,
    });
  }
};

/* ---------------- GET SINGLE ITEM ---------------- */

exports.getSingleStoreItem = async (req, res) => {
  try {
    const item = await ItemIdentity.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get Single Item Identity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch item identity",
      error: error.message,
    });
  }
};

/* ---------------- UPDATE ITEM ---------------- */

exports.updateStoreItem = async (req, res) => {
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

    if (req.file) {
      updateData.itemImage = req.file.path;
    }

    updateData.updatedBy = req.user?._id || null;

    const item = await ItemIdentity.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item identity updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Update Item Identity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item identity",
      error: error.message,
    });
  }
};

/* ---------------- SOFT DELETE ITEM ---------------- */

exports.deleteStoreItem = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      message: "Item identity deleted successfully",
    });
  } catch (error) {
    console.error("Delete Item Identity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete item identity",
      error: error.message,
    });
  }
};

/* ---------------- GET AVAILABLE ITEMS FOR CHALLAN ---------------- */
/* Stock comes from MainStoreStock, item detail comes from ItemIdentity */

exports.getAvailableItemsForChallan = async (req, res) => {
  try {
    const { mainStoreRef, search } = req.query;

    const stockQuery = {
      isActive: true,
      availableStock: { $gt: 0 },
    };

    if (mainStoreRef) {
      stockQuery.mainStoreRef = mainStoreRef;
    }

    let stocks = await MainStoreStock.find(stockQuery)
      .populate(
        "itemRef",
        "itemName itemCode category subCategory unit hsnCode description specification brand make gstPercentage"
      )
      .populate("mainStoreRef", "storeName storeCode location")
      .sort({ updatedAt: -1 });

    if (search) {
      const keyword = search.toLowerCase();

      stocks = stocks.filter((stock) => {
        const item = stock.itemRef;
        return (
          item?.itemName?.toLowerCase().includes(keyword) ||
          item?.itemCode?.toLowerCase().includes(keyword) ||
          item?.hsnCode?.toLowerCase().includes(keyword) ||
          item?.brand?.toLowerCase().includes(keyword) ||
          item?.make?.toLowerCase().includes(keyword)
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("Get Available Items For Challan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available stock items",
      error: error.message,
    });
  }
};

/* ---------------- BULK UPLOAD ITEM IDENTITIES ONLY ---------------- */
/* This does not create stock. Stock will be created by MRN/opening stock module later. */

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

        gstPercentage: cleanNumber(
          row.gstPercentage || row["GST Percentage"]
        ),

        minimumStockLevel: cleanNumber(
          row.minimumStockLevel || row["Minimum Stock Level"]
        ),

        reorderLevel: cleanNumber(
          row.reorderLevel || row["Reorder Level"]
        ),

        remarks: cleanString(row.remarks || row["Remarks"]),

        createdBy: req.user?._id || null,
      });

      insertedItems.push(item);
    }

    return res.status(201).json({
      success: true,
      message: "Bulk item identities uploaded successfully",
      insertedCount: insertedItems.length,
      skippedCount: skippedItems.length,
      insertedItems,
      skippedItems,
    });
  } catch (error) {
    console.error("Bulk Upload Item Identities Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload item identities",
      error: error.message,
    });
  }
};