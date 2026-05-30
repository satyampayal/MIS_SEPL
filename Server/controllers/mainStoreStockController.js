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