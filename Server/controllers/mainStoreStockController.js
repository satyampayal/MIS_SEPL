const XLSX = require("xlsx");
const MainStoreStock = require("../model/mainStoreStock");
const ItemIdentity = require("../model/ItemIdentity");
const MasterStore = require("../model/MasterStore");
const StockBatch = require("../model/stockBatch");

/* ---------------- HELPERS ---------------- */

const cleanNumber = (value = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const recalculateStock = (stock) => {
  stock.availableStock =
    cleanNumber(stock.currentStock) - cleanNumber(stock.reservedStock);

  stock.stockValue =
    cleanNumber(stock.currentStock) * cleanNumber(stock.averageRate);

  if (stock.currentStock < 0) {
    stock.stockStatus = "NEGATIVE_STOCK";
  } else if (stock.currentStock === 0) {
    stock.stockStatus = "OUT_OF_STOCK";
  } else if (stock.currentStock <= stock.minimumStockLevel) {
    stock.stockStatus = "LOW_STOCK";
  } else {
    stock.stockStatus = "AVAILABLE";
  }

  stock.lastMovementDate = new Date();
  return stock;
};

/* ---------------- ADD OPENING STOCK ---------------- */

exports.addOpeningStock = async (req, res) => {
  try {
    const {
      mainStoreRef,
      itemRef,
      openingQty,
      rate,
      location,
      rackNumber,
      remarks,
    } = req.body;

    const qty = cleanNumber(openingQty);
    const itemRate = cleanNumber(rate);

    if (!mainStoreRef || !itemRef) {
      return res.status(400).json({
        success: false,
        message: "Main store and item are required",
      });
    }

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Opening quantity must be greater than 0",
      });
    }

    const item = await ItemIdentity.findById(itemRef);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    const store = await MasterStore.findById(mainStoreRef);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Main store not found",
      });
    }

    let stock = await MainStoreStock.findOne({
      mainStoreRef,
      itemRef,
    });

    if (!stock) {
      stock = new MainStoreStock({
        mainStoreRef,
        itemRef,
        currentStock: qty,
        reservedStock: 0,
        averageRate: itemRate,
        minimumStockLevel: item.minimumStockLevel || 0,
        reorderLevel: item.reorderLevel || 0,
        location: location || "",
        rackNumber: rackNumber || "",
      });
    } else {
      const oldQty = cleanNumber(stock.currentStock);
      const oldRate = cleanNumber(stock.averageRate);
      const newTotalQty = oldQty + qty;

      const newAverageRate =
        newTotalQty > 0
          ? (oldQty * oldRate + qty * itemRate) / newTotalQty
          : itemRate;

      stock.currentStock = newTotalQty;
      stock.averageRate = newAverageRate;
      stock.location = location || stock.location;
      stock.rackNumber = rackNumber || stock.rackNumber;
    }

    recalculateStock(stock);
    await stock.save();

    await StockBatch.create({
      mainStoreRef,
      itemRef,
      sourceType: "ADJUSTMENT_IN",
      documentType: "ADJUSTMENT",
      documentNumber: `OPENING-${Date.now()}`,
      documentDate: new Date(),
      receivedQty: qty,
      remainingQty: qty,
      rate: itemRate,
      landingRate: itemRate,
      remarks: remarks || "Opening stock added",
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Opening stock added successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Add Opening Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add opening stock",
      error: error.message,
    });
  }
};

/* ---------------- GET LIVE STOCK ---------------- */

exports.getLiveStock = async (req, res) => {
  try {
    const { mainStoreRef, search, status, category } = req.query;

    const query = { isActive: true };

    if (mainStoreRef) query.mainStoreRef = mainStoreRef;
    if (status && status !== "All") query.stockStatus = status;

    let stocks = await MainStoreStock.find(query)
      .populate(
        "itemRef",
        "itemName itemCode category subCategory unit hsnCode brand make specification gstPercentage"
      )
      .populate("mainStoreRef", "storeName storeCode location")
      .sort({ updatedAt: -1 });

    if (category && category !== "All") {
      stocks = stocks.filter(
        (stock) => stock.itemRef?.category === category
      );
    }

    if (search) {
      const keyword = search.toLowerCase();

      stocks = stocks.filter((stock) => {
        const item = stock.itemRef;

        return (
          item?.itemName?.toLowerCase().includes(keyword) ||
          item?.itemCode?.toLowerCase().includes(keyword) ||
          item?.category?.toLowerCase().includes(keyword) ||
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
    console.error("Get Live Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch live stock",
      error: error.message,
    });
  }
};

/* ---------------- GET SINGLE STOCK ---------------- */

exports.getSingleStock = async (req, res) => {
  try {
    const stock = await MainStoreStock.findById(req.params.id)
      .populate("itemRef")
      .populate("mainStoreRef");

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error("Get Single Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock record",
      error: error.message,
    });
  }
};

/* ---------------- MANUAL STOCK ADJUSTMENT ---------------- */

exports.adjustStock = async (req, res) => {
  try {
    const { adjustmentType, quantity, rate, remarks } = req.body;

    const qty = cleanNumber(quantity);

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const stock = await MainStoreStock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found",
      });
    }

    if (adjustmentType === "IN") {
      const oldQty = cleanNumber(stock.currentStock);
      const oldRate = cleanNumber(stock.averageRate);
      const newRate = cleanNumber(rate || oldRate);
      const newTotalQty = oldQty + qty;

      stock.averageRate =
        newTotalQty > 0
          ? (oldQty * oldRate + qty * newRate) / newTotalQty
          : newRate;

      stock.currentStock = newTotalQty;

      await StockBatch.create({
        mainStoreRef: stock.mainStoreRef,
        itemRef: stock.itemRef,
        sourceType: "ADJUSTMENT_IN",
        documentType: "ADJUSTMENT",
        documentNumber: `ADJ-IN-${Date.now()}`,
        documentDate: new Date(),
        receivedQty: qty,
        remainingQty: qty,
        rate: newRate,
        landingRate: newRate,
        remarks: remarks || "Manual stock adjustment IN",
        createdBy: req.user?._id || null,
      });
    } else if (adjustmentType === "OUT") {
      if (qty > cleanNumber(stock.availableStock)) {
        return res.status(400).json({
          success: false,
          type: "STOCK_ERROR",
          availableQty: stock.availableStock,
          enteredQty: qty,
          message: `Only ${stock.availableStock} quantity available`,
        });
      }

      stock.currentStock = cleanNumber(stock.currentStock) - qty;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment type. Use IN or OUT",
      });
    }

    recalculateStock(stock);
    await stock.save();

    return res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Adjust Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to adjust stock",
      error: error.message,
    });
  }
};

/* ---------------- LOW STOCK ---------------- */

exports.getLowStock = async (req, res) => {
  try {
    const stocks = await MainStoreStock.find({
      isActive: true,
      stockStatus: "LOW_STOCK",
    })
      .populate("itemRef", "itemName itemCode unit category")
      .populate("mainStoreRef", "storeName storeCode")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("Get Low Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch low stock",
      error: error.message,
    });
  }
};

/* ---------------- NEGATIVE STOCK ---------------- */

exports.getNegativeStock = async (req, res) => {
  try {
    const stocks = await MainStoreStock.find({
      isActive: true,
      stockStatus: "NEGATIVE_STOCK",
    })
      .populate("itemRef", "itemName itemCode unit category")
      .populate("mainStoreRef", "storeName storeCode")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("Get Negative Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch negative stock",
      error: error.message,
    });
  }
};

/* ---------------- ADD BULK OPENING STOCK ---------------- */

exports.bulkMainOpeningStockUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    let createdCount = 0;
    let updatedCount = 0;
    const skippedRows = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const storeCode = String(row.storeCode || row["Store Code"] || "").trim();
      const itemCode = String(row.itemCode || row["Item Code"] || "")
        .trim()
        .toUpperCase();

      const openingQty = Number(row.openingQty || row["Opening Qty"] || 0);
      const rate = Number(row.rate || row["Rate"] || 0);

      if (!storeCode || !itemCode) {
        skippedRows.push({
          row: i + 2,
          reason: "Store Code and Item Code are required",
          data: row,
        });
        continue;
      }

      if (openingQty <= 0) {
        skippedRows.push({
          row: i + 2,
          reason: "Opening Qty must be greater than 0",
          data: row,
        });
        continue;
      }

      const store = await MasterStore.findOne({ storeCode });

      if (!store) {
        skippedRows.push({
          row: i + 2,
          reason: `Store not found for storeCode: ${storeCode}`,
          data: row,
        });
        continue;
      }

      const item = await ItemIdentity.findOne({ itemCode });

      if (!item) {
        skippedRows.push({
          row: i + 2,
          reason: `Item not found for itemCode: ${itemCode}`,
          data: row,
        });
        continue;
      }

      let stock = await MainStoreStock.findOne({
        mainStoreRef: store._id,
        itemRef: item._id,
      });

      if (stock) {
        const oldQty = Number(stock.currentStock || 0);
        const oldRate = Number(stock.averageRate || 0);
        const newQty = oldQty + openingQty;

        stock.currentStock = newQty;
        stock.averageRate =
          newQty > 0 ? (oldQty * oldRate + openingQty * rate) / newQty : rate;

        stock.minimumStockLevel = item.minimumStockLevel || stock.minimumStockLevel || 0;
        stock.reorderLevel = item.reorderLevel || stock.reorderLevel || 0;
        stock.location = row.location || row["Location"] || stock.location;
        stock.rackNumber = row.rackNumber || row["Rack Number"] || stock.rackNumber;

        await stock.save();
        updatedCount++;
      } else {
        await MainStoreStock.create({
          mainStoreRef: store._id,
          itemRef: item._id,
          currentStock: openingQty,
          reservedStock: 0,
          averageRate: rate,
          minimumStockLevel: item.minimumStockLevel || 0,
          reorderLevel: item.reorderLevel || 0,
          location: row.location || row["Location"] || "",
          rackNumber: row.rackNumber || row["Rack Number"] || "",
        });

        createdCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Main store opening stock uploaded successfully",
      createdCount,
      updatedCount,
      skippedCount: skippedRows.length,
      skippedRows,
    });
  } catch (error) {
    console.error("Bulk Main Opening Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload main store opening stock",
      error: error.message,
    });
  }
};

/* ---------------- Update single STOCK ---------------- */

exports.updateMainStoreStock = async (req, res) => {
  try {
    const {
      currentStock,
      reservedStock,
      averageRate,
      minimumStockLevel,
      reorderLevel,
      location,
      rackNumber,
    } = req.body;

    const stock = await MainStoreStock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found",
      });
    }

    stock.currentStock = Number(currentStock || 0);
    stock.reservedStock = Number(reservedStock || 0);
    stock.averageRate = Number(averageRate || 0);
    stock.minimumStockLevel = Number(minimumStockLevel || 0);
    stock.reorderLevel = Number(reorderLevel || 0);
    stock.location = location || "";
    stock.rackNumber = rackNumber || "";

    await stock.save();

    return res.status(200).json({
      success: true,
      message: "Main store stock updated successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Update Main Store Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update main store stock",
      error: error.message,
    });
  }
};

/* ---------------- Soft Delete OPENING STOCK ---------------- */

exports.deleteMainStoreStock = async (req, res) => {
  try {
    const stock = await MainStoreStock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found",
      });
    }

    stock.isActive = false;
    await stock.save();

    return res.status(200).json({
      success: true,
      message: "Main store stock deleted successfully",
    });
  } catch (error) {
    console.error("Delete Main Store Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete main store stock",
      error: error.message,
    });
  }
};