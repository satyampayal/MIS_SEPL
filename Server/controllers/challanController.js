const mongoose = require("mongoose");
const Challan = require("../model/Challan");
const ItemIdentity = require("../model/ItemIdentity");
const MainStoreStock = require("../model/mainStoreStock");
const SiteStoreStock = require("../model/SiteStoreStock");
const StockBatch = require("../model/stockBatch");
const ProjectBoqItem = require("../model/projectBoqItem");
const BOQMaster = require("../model/boqMaster");
const cleanNumber = (value = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const increaseStock = async ({ Model, findQuery, qty, rate }) => {
  let stock = await Model.findOne(findQuery);

  if (!stock) {
    stock = new Model({
      ...findQuery,
      currentStock: 0,
      reservedStock: 0,
      averageRate: cleanNumber(rate),
    });
  }

  const oldQty = cleanNumber(stock.currentStock);
  const oldRate = cleanNumber(stock.averageRate);
  const newQty = oldQty + cleanNumber(qty);

  stock.averageRate =
    newQty > 0
      ? (oldQty * oldRate + cleanNumber(qty) * cleanNumber(rate)) / newQty
      : cleanNumber(rate);

  stock.currentStock = newQty;
  await stock.save();

  return stock;
};

const reserveStock = async ({ stock, qty }) => {
  if (cleanNumber(qty) > cleanNumber(stock.availableStock)) {
    throw new Error(`Only ${stock.availableStock} quantity available`);
  }

  stock.reservedStock = cleanNumber(stock.reservedStock) + cleanNumber(qty);
  await stock.save();
};

const deductReservedStock = async ({ stock, qty }) => {
  stock.currentStock = cleanNumber(stock.currentStock) - cleanNumber(qty);
  stock.reservedStock = cleanNumber(stock.reservedStock) - cleanNumber(qty);

  if (stock.reservedStock < 0) stock.reservedStock = 0;

  await stock.save();
};

const releaseReservedStock = async ({ stock, qty }) => {
  stock.reservedStock = cleanNumber(stock.reservedStock) - cleanNumber(qty);

  if (stock.reservedStock < 0) stock.reservedStock = 0;

  await stock.save();
};

/* CREATE CHALLAN */
exports.createChallan = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      documentNumber,
      documentDate,
      documentType,
      fromMainStoreRef,
      toSiteRef,
      fromSiteRef,
      toMainStoreRef,
      vendorRef,
      vendorName,
      projectRef,
      projectName,
      items,
      remarks,
    } = req.body;

    if (!documentNumber || !documentType) {
      throw new Error("Document number and document type are required");
    }

    if (!items || !items.length) {
      throw new Error("At least one item is required");
    }

    const exists = await Challan.findOne({ documentNumber }).session(session);

    if (exists) {
      throw new Error("Document number already exists");
    }

    const finalItems = [];

    for (const row of items) {
      const item = await ItemIdentity.findById(row.itemRef).session(session);

      if (!item) {
        throw new Error("Invalid item selected");
      }
      //  If purpose of challan creted is Installtion 
      if (row.itemPurpose === "BOQ_INSTALLATION") {
        if (!row.boqItemRef || !row.boqRef) {
          throw new Error(`${item.itemName}: BOQ item reference is required`);
        }

        const boqItem = await ProjectBoqItem.findOne({
          _id: row.boqItemRef,
          boqRef: row.boqRef,
        }).session(session);

        if (!boqItem) {
          throw new Error(`${item.itemName}: BOQ item not found`);
        }

        const boq = await BOQMaster.findOne({
          _id: row.boqRef,
          projectRef: projectRef || toSiteRef,
        }).session(session);

        if (!boq) {
          throw new Error(`${item.itemName}: BOQ does not belong to selected project/site`);
        }

        const alreadyIssuedQty = cleanNumber(boqItem.alreadyIssuedQty || 0);
        const boqQty = cleanNumber(boqItem.poQty || 0);
        const remainingBoqQty = boqQty - alreadyIssuedQty;

        if (qty > remainingBoqQty) {
          throw new Error(
            `${item.itemName}: BOQ remaining qty is only ${remainingBoqQty}`
          );
        }

        row.boqQty = boqQty;
        row.alreadyIssuedQty = alreadyIssuedQty;
        row.remainingBoqQty = remainingBoqQty;
      }

      //  End of Boq Related Validations

      const qty = cleanNumber(row.quantity);
      const rate = cleanNumber(row.rate);

      if (qty <= 0) {
        throw new Error(`Quantity must be greater than 0 for ${item.itemName}`);
      }

      let fromStockRef = null;
      let toStockRef = null;

      if (documentType === "DC") {
        const stock = await MainStoreStock.findOne({
          mainStoreRef: fromMainStoreRef,
          itemRef: item._id,
        }).session(session);

        if (!stock) throw new Error(`${item.itemName} stock not found in main store`);

        await reserveStock({ stock, qty });
        fromStockRef = stock._id;
      }

      if (documentType === "MRS" || documentType === "ISTN") {
        const stock = await SiteStoreStock.findOne({
          siteRef: fromSiteRef,
          itemRef: item._id,
        }).session(session);

        if (!stock) throw new Error(`${item.itemName} stock not found in source site`);

        await reserveStock({ stock, qty });
        fromStockRef = stock._id;
      }

      finalItems.push({
        itemPurpose: row.itemPurpose || "BOQ_INSTALLATION",
        boqItemRef: row.boqItemRef || null,
        boqRef: row.boqRef || null,
        boqQty: cleanNumber(row.boqQty),
        alreadyIssuedQty: cleanNumber(row.alreadyIssuedQty),
        remainingBoqQty: cleanNumber(row.remainingBoqQty),
        isReturnable: row.itemPurpose === "TOOL" ? true : Boolean(row.isReturnable),
        expectedReturnDate: row.expectedReturnDate || null,
        itemRef: item._id,
        fromStockRef,
        toStockRef,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        hsnCode: item.hsnCode,
        quantity: qty,
        rate,
        amount: qty * rate,
        remarks: row.remarks || "",
      });
    }

    const challan = await Challan.create(
      [
        {
          documentNumber,
          documentDate: documentDate || new Date(),
          documentType,
          fromMainStoreRef: fromMainStoreRef || null,
          toMainStoreRef: toMainStoreRef || null,
          fromSiteRef: fromSiteRef || null,
          toSiteRef: toSiteRef || null,
          vendorRef: vendorRef || null,
          vendorName: vendorName || "",
          projectRef: projectRef || toSiteRef || fromSiteRef || null,
          projectName: projectName || "",
          items: finalItems,
          approvalStatus: "PENDING_SITE_APPROVAL",
          stockStatus:
            ["DC", "MRS", "ISTN"].includes(documentType) ? "RESERVED" : "NOT_APPLIED",
          deliveryStatus: "PENDING",
          remarks: remarks || "",
          challanFile: req.file ? req.file.path : "",
          createdBy: req.user?._id || null,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Challan created and sent for site approval",
      data: challan[0],
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

/* APPROVE CHALLAN */
exports.approveChallan = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const challan = await Challan.findById(req.params.id).session(session);

    if (!challan) throw new Error("Challan not found");

    if (challan.approvalStatus !== "PENDING_SITE_APPROVAL") {
      throw new Error("Only pending challan can be approved");
    }

    for (const item of challan.items) {
      const qty = cleanNumber(item.quantity);
      const rate = cleanNumber(item.rate);

      if (challan.documentType === "DC") {
        const mainStock = await MainStoreStock.findById(item.fromStockRef).session(session);
        if (!mainStock) throw new Error(`${item.itemName} main stock not found`);

        await deductReservedStock({ stock: mainStock, qty });

        const siteStock = await increaseStock({
          Model: SiteStoreStock,
          findQuery: {
            siteRef: challan.toSiteRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
        });

        item.toStockRef = siteStock._id;
      }

      if (challan.documentType === "DDC" || challan.documentType === "LPN") {
        const siteStock = await increaseStock({
          Model: SiteStoreStock,
          findQuery: {
            siteRef: challan.toSiteRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
        });

        item.toStockRef = siteStock._id;
      }

      if (challan.documentType === "MRS") {
        const siteStock = await SiteStoreStock.findById(item.fromStockRef).session(session);
        if (!siteStock) throw new Error(`${item.itemName} site stock not found`);

        await deductReservedStock({ stock: siteStock, qty });

        const mainStock = await increaseStock({
          Model: MainStoreStock,
          findQuery: {
            mainStoreRef: challan.toMainStoreRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
        });

        item.toStockRef = mainStock._id;

        await StockBatch.create(
          [
            {
              mainStoreRef: challan.toMainStoreRef,
              itemRef: item.itemRef,
              sourceType: "SITE_RETURN",
              documentType: "MRS",
              documentNumber: challan.documentNumber,
              documentDate: challan.documentDate,
              receivedQty: qty,
              remainingQty: qty,
              rate,
              landingRate: rate,
              remarks: "Site material return approved",
              createdBy: req.user?._id || null,
            },
          ],
          { session }
        );
      }

      if (challan.documentType === "ISTN") {
        const fromSiteStock = await SiteStoreStock.findById(item.fromStockRef).session(session);
        if (!fromSiteStock) throw new Error(`${item.itemName} source site stock not found`);

        await deductReservedStock({ stock: fromSiteStock, qty });

        const toSiteStock = await increaseStock({
          Model: SiteStoreStock,
          findQuery: {
            siteRef: challan.toSiteRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
        });

        item.toStockRef = toSiteStock._id;
      }
    }

    challan.approvalStatus = "APPROVED_BY_SITE";
    challan.stockStatus = "UPDATED";
    challan.deliveryStatus =
      challan.destinationType === "MAIN_STORE"
        ? "RECEIVED_AT_STORE"
        : "RECEIVED_AT_SITE";

    challan.siteApprovedBy = req.user?._id || null;
    challan.siteApprovedAt = new Date();

    await challan.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Challan approved and stock updated successfully",
      data: challan,
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

/* REJECT CHALLAN */
exports.rejectChallan = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { rejectionReason } = req.body;

    const challan = await Challan.findById(req.params.id).session(session);

    if (!challan) throw new Error("Challan not found");

    if (challan.approvalStatus !== "PENDING_SITE_APPROVAL") {
      throw new Error("Only pending challan can be rejected");
    }

    for (const item of challan.items) {
      if (!item.fromStockRef) continue;

      const StockModel =
        challan.documentType === "DC" ? MainStoreStock : SiteStoreStock;

      const stock = await StockModel.findById(item.fromStockRef).session(session);

      if (stock) {
        await releaseReservedStock({
          stock,
          qty: item.quantity,
        });
      }
    }

    challan.approvalStatus = "REJECTED_BY_SITE";
    challan.stockStatus = "RELEASED";
    challan.rejectedBy = req.user?._id || null;
    challan.rejectedAt = new Date();
    challan.rejectionReason = rejectionReason || "Rejected by site";

    await challan.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Challan rejected and reserved stock released",
      data: challan,
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

/* GET ALL CHALLANS */
exports.getAllChallans = async (req, res) => {
  try {
    const { documentType, approvalStatus, stockStatus, siteRef } = req.query;

    const query = {};

    if (documentType && documentType !== "All") query.documentType = documentType;
    if (approvalStatus && approvalStatus !== "All") query.approvalStatus = approvalStatus;
    if (stockStatus && stockStatus !== "All") query.stockStatus = stockStatus;

    if (siteRef) {
      query.$or = [{ toSiteRef: siteRef }, { fromSiteRef: siteRef }];
    }

    const challans = await Challan.find(query)
      .populate("fromMainStoreRef", "storeName storeCode")
      .populate("toMainStoreRef", "storeName storeCode")
      .populate("fromSiteRef", "projectName name")
      .populate("toSiteRef", "projectName name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: challans.length,
      data: challans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch challans",
      error: error.message,
    });
  }
};