const SiteStoreStock = require("../model/SiteStoreStock");

exports.getSiteLiveStock = async (req, res) => {
  try {
    const { siteRef, search, status, category } = req.query;

    const query = { isActive: true };

    if (siteRef) query.siteRef = siteRef;
    if (status && status !== "All") query.stockStatus = status;

    let stocks = await SiteStoreStock.find(query)
      .populate(
        "itemRef",
        "itemName itemCode category subCategory unit hsnCode brand make specification"
      )
      .populate("siteRef", "projectName name location siteIncharge")
      .sort({ updatedAt: -1 });

    if (category && category !== "All") {
      stocks = stocks.filter((s) => s.itemRef?.category === category);
    }

    if (search) {
      const keyword = search.toLowerCase();

      stocks = stocks.filter((s) => {
        const item = s.itemRef;
        return (
          item?.itemName?.toLowerCase().includes(keyword) ||
          item?.itemCode?.toLowerCase().includes(keyword) ||
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
    console.error("Get Site Live Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site live stock",
      error: error.message,
    });
  }
};

exports.getSiteStockBySite = async (req, res) => {
  try {
    const stocks = await SiteStoreStock.find({
      siteRef: req.params.siteId,
      isActive: true,
    })
      .populate(
        "itemRef",
        "itemName itemCode category subCategory unit hsnCode brand make specification"
      )
      .populate("siteRef", "projectName name location siteIncharge")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("Get Site Stock By Site Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site stock",
      error: error.message,
    });
  }
};

exports.getSingleSiteStock = async (req, res) => {
  try {
    const stock = await SiteStoreStock.findById(req.params.id)
      .populate("itemRef")
      .populate("siteRef");

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Site stock record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error("Get Single Site Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site stock record",
      error: error.message,
    });
  }
};

exports.adjustSiteStock = async (req, res) => {
  try {
    const { adjustmentType, quantity, remarks } = req.body;

    const qty = Number(quantity || 0);

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const stock = await SiteStoreStock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Site stock record not found",
      });
    }

    if (adjustmentType === "IN") {
      stock.currentStock = Number(stock.currentStock || 0) + qty;
    } else if (adjustmentType === "OUT") {
      if (qty > Number(stock.availableStock || 0)) {
        return res.status(400).json({
          success: false,
          type: "STOCK_ERROR",
          availableQty: stock.availableStock,
          enteredQty: qty,
          message: `Only ${stock.availableStock} quantity available`,
        });
      }

      stock.currentStock = Number(stock.currentStock || 0) - qty;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment type. Use IN or OUT",
      });
    }

    if (remarks) stock.remarks = remarks;

    await stock.save();

    return res.status(200).json({
      success: true,
      message: "Site stock adjusted successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Adjust Site Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to adjust site stock",
      error: error.message,
    });
  }
};

exports.getLowSiteStock = async (req, res) => {
  try {
    const stocks = await SiteStoreStock.find({
      isActive: true,
      stockStatus: "LOW_STOCK",
    })
      .populate("itemRef", "itemName itemCode unit category")
      .populate("siteRef", "projectName name location")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("Get Low Site Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch low site stock",
      error: error.message,
    });
  }
};