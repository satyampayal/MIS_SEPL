const XLSX = require("xlsx");
const SiteStoreStock = require("../model/SiteStoreStock");
const ItemIdentity = require("../model/ItemIdentity");
const ProjectMaster = require("../model/Project");
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

exports.addSiteOpeningStock = async (req, res) => {
  try {
    const {
      siteRef,
      itemRef,
      receivedTillDate,
      consumedTillDate,
      returnedTillDate,
      damagedTillDate,
      rate,
      location,
      remarks,
    } = req.body;

    if (!siteRef || !itemRef) {
      return res.status(400).json({
        success: false,
        message: "Site and item are required",
      });
    }

    const received = Number(receivedTillDate || 0);
    const consumed = Number(consumedTillDate || 0);
    const returned = Number(returnedTillDate || 0);
    const damaged = Number(damagedTillDate || 0);

    const currentStock = received - consumed - returned - damaged;

    if (received <= 0) {
      return res.status(400).json({
        success: false,
        message: "Received till date must be greater than 0",
      });
    }

    if (currentStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Consumed + Returned + Damaged cannot be greater than received quantity",
      });
    }

    const item = await ItemIdentity.findById(itemRef);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item identity not found",
      });
    }

    let stock = await SiteStoreStock.findOne({ siteRef, itemRef });

    if (!stock) {
      stock = new SiteStoreStock({
        siteRef,
        itemRef,
        currentStock,
        consumedQty: consumed,
        returnedQty: returned,
        damagedQty: damaged,
        averageRate: Number(rate || 0),
        minimumStockLevel: item.minimumStockLevel || 0,
        location: location || "",
      });
    } else {
      stock.currentStock = Number(stock.currentStock || 0) + currentStock;
      stock.consumedQty = Number(stock.consumedQty || 0) + consumed;
      stock.returnedQty = Number(stock.returnedQty || 0) + returned;
      stock.damagedQty = Number(stock.damagedQty || 0) + damaged;
      stock.averageRate = Number(rate || stock.averageRate || 0);
      stock.location = location || stock.location;
    }

    await stock.save();

    return res.status(201).json({
      success: true,
      message: "Site opening stock added successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Add Site Opening Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add site opening stock",
      error: error.message,
    });
  }
};

exports.bulkSiteOpeningStockUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const workbook = XLSX.readFile(req.file.path);

    const sheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    let createdCount = 0;
    let updatedCount = 0;

    const skippedRows = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        const projectCode = String(
          row.projectCode || row["Project Code"] || ""
        ).trim();

        const itemCode = String(
          row.itemCode || row["Item Code"] || ""
        ).trim().toUpperCase();

        if (!projectCode || !itemCode) {
          skippedRows.push({
            row: i + 2,
            reason: "Project Code and Item Code required",
          });
          continue;
        }

        const project = await ProjectMaster.findOne({
          projectCode,
        });

        if (!project) {
          skippedRows.push({
            row: i + 2,
            reason: `Project not found : ${projectCode}`,
          });
          continue;
        }

        const item = await ItemIdentity.findOne({
          itemCode,
        });

        if (!item) {
          skippedRows.push({
            row: i + 2,
            reason: `Item not found : ${itemCode}`,
          });
          continue;
        }

        const receivedQty = Number(
          row.receivedTillDate ||
            row["Received Till Date"] ||
            0
        );

        const consumedQty = Number(
          row.consumedTillDate ||
            row["Consumed Till Date"] ||
            0
        );

        const returnedQty = Number(
          row.returnedTillDate ||
            row["Returned Till Date"] ||
            0
        );

        const damagedQty = Number(
          row.damagedTillDate ||
            row["Damaged Till Date"] ||
            0
        );

        const currentStock =
          receivedQty -
          consumedQty -
          returnedQty -
          damagedQty;

        if (currentStock < 0) {
          skippedRows.push({
            row: i + 2,
            reason:
              "Calculated stock cannot be negative",
          });
          continue;
        }

        let stock =
          await SiteStoreStock.findOne({
            siteRef: project._id,
            itemRef: item._id,
          });

        if (stock) {
          stock.currentStock += currentStock;
          stock.consumedQty += consumedQty;
          stock.returnedQty += returnedQty;
          stock.damagedQty += damagedQty;

          stock.averageRate =
            Number(
              row.rate || row["Rate"] || 0
            ) || stock.averageRate;

          stock.location =
            row.location ||
            row["Location"] ||
            stock.location;

          await stock.save();

          updatedCount++;
        } else {
          stock =
            await SiteStoreStock.create({
              siteRef: project._id,
              itemRef: item._id,

              currentStock,

              consumedQty,
              returnedQty,
              damagedQty,

              averageRate: Number(
                row.rate || row["Rate"] || 0
              ),

              minimumStockLevel:
                item.minimumStockLevel || 0,

              reorderLevel:
                item.reorderLevel || 0,

              location:
                row.location ||
                row["Location"] ||
                "",

              remarks:
                row.remarks ||
                row["Remarks"] ||
                "",
            });

          createdCount++;
        }
      } catch (err) {
        skippedRows.push({
          row: i + 2,
          reason: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Site opening stock uploaded successfully",

      createdCount,
      updatedCount,

      skippedCount: skippedRows.length,

      skippedRows,
    });
  } catch (error) {
    console.error(
      "Bulk Site Opening Stock Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload site opening stock",
      error: error.message,
    });
  }
};