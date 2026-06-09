const mongoose = require("mongoose");
const Challan = require("../model/Challan");
const ItemIdentity = require("../model/ItemIdentity");
const MainStoreStock = require("../model/mainStoreStock");
const SiteStoreStock = require("../model/SiteStoreStock");
const StockBatch = require("../model/stockBatch");
const ProjectBoqItem = require("../model/projectBoqItem");
const BOQMaster = require("../model/boqMaster");
const ProcurementPlan = require("../model/ProcurementPlan");

const MaterialRequisition = require('../model/MaterialRequisition')

const createStockTransaction = require("../utils/createStockTransaction");
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

  const canCreateChallan = [
    "Super Admin",
    "Admin",
    "Project Manager",
    "Store Manager",
    "MIS User"
  ].includes(req.user.role);

  if (!canCreateChallan) {
    return res.status(403).json({
      success: false,
      message: "Access Denied",
    });
  }
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
      materialRequisitionRef,
      procurementPlanRef,
      procurementItemId,
      procurementItemIds,
    } = req.body;

    if (!documentNumber || !documentType) {
      throw new Error("Document number and document type are required");
    }

    if (!items || !items.length) {
      throw new Error("At least one item is required");
    }

    const exists = await Challan.findOne({ documentNumber }).session(session);
    if (exists) throw new Error("Document number already exists");

    const finalItems = [];

    for (const row of items) {
      const qty = cleanNumber(row.quantity);
      const rate = cleanNumber(row.rate);

      if (qty <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      const item = await ItemIdentity.findById(row.itemRef).session(session);
      if (!item) throw new Error("Invalid item selected");

      if (row.itemPurpose === "BOQ_INSTALLATION") {
        if (!row.boqItemRef || !row.boqRef) {
          throw new Error(`${item.itemName}: BOQ item reference is required`);
        }

        const boqItem = await ProjectBoqItem.findOne({
          _id: row.boqItemRef,
          boqRef: row.boqRef,
        }).session(session);

        if (!boqItem) throw new Error(`${item.itemName}: BOQ item not found`);

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
          throw new Error(`${item.itemName}: BOQ remaining qty is only ${remainingBoqQty}`);
        }

        row.boqQty = boqQty;
        row.alreadyIssuedQty = alreadyIssuedQty;
        row.remainingBoqQty = remainingBoqQty;
      }

      let fromStockRef = null;
      let stockModel = null;
      let stockQuery = null;

      if (documentType === "DC") {
        stockModel = MainStoreStock;
        stockQuery = {
          mainStoreRef: fromMainStoreRef,
          itemRef: item._id,
        };
      }

      if (documentType === "MRS" || documentType === "ISTN") {
        stockModel = SiteStoreStock;
        stockQuery = {
          siteRef: fromSiteRef,
          itemRef: item._id,
        };
      }

      if (stockModel && stockQuery) {
        const stock = await stockModel.findOne(stockQuery).session(session);

        if (!stock) {
          throw new Error(`${item.itemName} stock not found`);
        }

        const availableStock =
          cleanNumber(stock.currentStock) - cleanNumber(stock.reservedStock);

        if (qty > availableStock) {
          throw new Error(
            `${item.itemName}: only ${availableStock} qty available`
          );
        }

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
        toStockRef: null,

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

    const [challan] = await Challan.create(
      [
        {
          documentNumber,
          documentDate: documentDate || new Date(),
          documentType,

          materialRequisitionRef: materialRequisitionRef || null,
          procurementPlanRef: procurementPlanRef || null,
          procurementItemId: procurementItemId || null,
          procurementItemIds: Array.isArray(procurementItemIds)
            ? procurementItemIds
            : [],

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
            ["DC", "MRS", "ISTN"].includes(documentType)
              ? "RESERVED"
              : "NOT_APPLIED",

          deliveryStatus: "PENDING",
          remarks: remarks || "",
          challanFile: req.file ? req.file.path : "",
          createdBy: req.user?._id || null,
        },
      ],
      { session }
    );


    //MRQ CHALLAN Start

    // if (materialRequisitionRef) {
    //   const mrq = await MaterialRequisition.findById(
    //     materialRequisitionRef
    //   ).session(session);;

    //   if (mrq) {
    //     for (const challanItem of items) {

    //       const mrqItem = mrq.items.find(
    //         (x) =>
    //           x.itemRef.toString() ===
    //           challanItem.itemRef.toString()
    //       );

    //       if (mrqItem) {
    //         mrqItem.issuedQty += Number(
    //           challanItem.quantity || 0
    //         );
    //       }
    //     }

    //     const allIssued = mrq.items.every(
    //       (item) =>
    //         Number(item.issuedQty || 0) >=
    //         Number(
    //           item.approvedQty ||
    //           item.requiredQty ||
    //           0
    //         )
    //     );

    //     const anyIssued = mrq.items.some(
    //       (item) => Number(item.issuedQty || 0) > 0
    //     );

    //     mrq.status = allIssued
    //       ? "ISSUED"
    //       : anyIssued
    //         ? "PARTIAL_ISSUED"
    //         : mrq.status;

    //     await mrq.save({ session });
    //   }
    // }

    //MRQ CHALLAN END

    //PP Challan Start
    if (procurementPlanRef) {
      const plan = await ProcurementPlan.findById(procurementPlanRef).session(session);

      if (plan) {
        const idsToUpdate =
          Array.isArray(procurementItemIds) && procurementItemIds.length > 0
            ? procurementItemIds
            : procurementItemId
              ? [procurementItemId]
              : [];

        for (const id of idsToUpdate) {
          const planItem = plan.items.id(id);

          if (planItem) {
            planItem.executionStatus = "CHALLAN_CREATED";
            planItem.challanRef = challan._id;
            planItem.challanNumber = challan.documentNumber;
            planItem.challanCreatedAt = new Date();
          }
        }

        const allDone = plan.items.every((item) =>
          ["CHALLAN_CREATED", "COMPLETED"].includes(item.executionStatus)
        );

        const anyDone = plan.items.some((item) =>
          ["CHALLAN_CREATED", "COMPLETED"].includes(item.executionStatus)
        );

        plan.status = allDone ? "COMPLETED" : anyDone ? "IN_PROGRESS" : "PENDING";

        await plan.save({ session });
      }
    }
    // PP Challan End
    for (const item of challan.items) {
      const qty = cleanNumber(item.quantity);

      if (!["DC", "MRS", "ISTN"].includes(challan.documentType)) continue;
      if (!item.fromStockRef) continue;

      const StockModel =
        challan.documentType === "DC" ? MainStoreStock : SiteStoreStock;

      const stock = await StockModel.findById(item.fromStockRef).session(session);

      if (!stock) {
        throw new Error(`${item.itemName} stock not found while reserving`);
      }

      const oldCurrentStock = stock.currentStock || 0;
      const oldReservedStock = stock.reservedStock || 0;

      await reserveStock({ stock, qty });

      await createStockTransaction({
        itemRef: item.itemRef,

        procurementPlanRef,
        procurementItemId,
        mainStoreRef:
          challan.documentType === "DC" ? challan.fromMainStoreRef : null,

        siteRef:
          challan.documentType !== "DC" ? challan.fromSiteRef : null,

        transactionType: "CHALLAN_RESERVED",
        direction: "RESERVE",

        quantity: qty,

        beforeStock: oldCurrentStock,
        afterStock: stock.currentStock,

        beforeReservedStock: oldReservedStock,
        afterReservedStock: stock.reservedStock,

        rate: stock.averageRate || item.rate || 0,

        referenceType: "CHALLAN",
        referenceId: challan._id,
        referenceNumber: challan.documentNumber,

        remarks: "Stock reserved during challan creation",
        createdBy: req.user?._id || null,
        session,
      });
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Challan created and sent for site approval",
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

/* APPROVE CHALLAN */
/* APPROVE CHALLAN */
exports.approveChallan = async (req, res) => {

  const canApproveChallan = [
    "Super Admin",
    "Admin",
    "Project Manager",
    "Store Manager",
    "MIS User"
  ].includes(req.user.role);

  if (!canApproveChallan) {
    return res.status(403).json({
      success: false,
      message: "Access Denied",
    });
  }


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

      /* DC: Main Store -> Site Store */
      if (challan.documentType === "DC") {
        const mainStock = await MainStoreStock.findById(item.fromStockRef).session(session);
        if (!mainStock) throw new Error(`${item.itemName} main stock not found`);

        const oldMainStock = mainStock.currentStock || 0;
        const oldMainReserved = mainStock.reservedStock || 0;

        await deductReservedStock({ stock: mainStock, qty });

        await createStockTransaction({
          itemRef: item.itemRef,
          mainStoreRef: challan.fromMainStoreRef,
          transactionType: "CHALLAN_APPROVED_OUT",
          direction: "OUT",
          quantity: qty,
          beforeStock: oldMainStock,
          afterStock: mainStock.currentStock,
          beforeReservedStock: oldMainReserved,
          afterReservedStock: mainStock.reservedStock,
          rate: mainStock.averageRate || rate || 0,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Main store stock deducted after challan approval",
          createdBy: req.user?._id || null,
          session,
        });

        let oldSiteStock = 0;

        const existingSiteStock = await SiteStoreStock.findOne({
          siteRef: challan.toSiteRef,
          itemRef: item.itemRef,
        }).session(session);

        if (existingSiteStock) {
          oldSiteStock = existingSiteStock.currentStock || 0;
        }

        const siteStock = await increaseStock({
          Model: SiteStoreStock,
          findQuery: {
            siteRef: challan.toSiteRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
          session,
        });

        await createStockTransaction({
          itemRef: item.itemRef,
          siteRef: challan.toSiteRef,
          transactionType: "CHALLAN_RECEIVED_SITE",
          direction: "IN",
          quantity: qty,
          beforeStock: oldSiteStock,
          afterStock: siteStock.currentStock,
          rate,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Stock added to site store after challan approval",
          createdBy: req.user?._id || null,
          session,
        });

        item.toStockRef = siteStock._id;
      }

      /* DDC / LPN: Direct Vendor -> Site Store */
      if (challan.documentType === "DDC" || challan.documentType === "LPN") {
        let oldSiteStock = 0;

        const existingSiteStock = await SiteStoreStock.findOne({
          siteRef: challan.toSiteRef,
          itemRef: item.itemRef,
        }).session(session);

        if (existingSiteStock) {
          oldSiteStock = existingSiteStock.currentStock || 0;
        }

        const siteStock = await increaseStock({
          Model: SiteStoreStock,
          findQuery: {
            siteRef: challan.toSiteRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
          session,
        });

        await createStockTransaction({
          itemRef: item.itemRef,
          siteRef: challan.toSiteRef,
          transactionType: "CHALLAN_RECEIVED_SITE",
          direction: "IN",
          quantity: qty,
          beforeStock: oldSiteStock,
          afterStock: siteStock.currentStock,
          rate,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Direct challan stock added to site store",
          createdBy: req.user?._id || null,
          session,
        });

        item.toStockRef = siteStock._id;
      }

      /* MRS: Site Store -> Main Store Return */
      if (challan.documentType === "MRS") {
        const siteStock = await SiteStoreStock.findById(item.fromStockRef).session(session);
        if (!siteStock) throw new Error(`${item.itemName} site stock not found`);

        const oldSiteStock = siteStock.currentStock || 0;
        const oldSiteReserved = siteStock.reservedStock || 0;

        await deductReservedStock({ stock: siteStock, qty });

        await createStockTransaction({
          itemRef: item.itemRef,
          siteRef: challan.fromSiteRef,
          transactionType: "CHALLAN_APPROVED_OUT",
          direction: "OUT",
          quantity: qty,
          beforeStock: oldSiteStock,
          afterStock: siteStock.currentStock,
          beforeReservedStock: oldSiteReserved,
          afterReservedStock: siteStock.reservedStock,
          rate,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Site stock returned after MRS approval",
          createdBy: req.user?._id || null,
          session,
        });

        let oldMainStock = 0;

        const existingMainStock = await MainStoreStock.findOne({
          mainStoreRef: challan.toMainStoreRef,
          itemRef: item.itemRef,
        }).session(session);

        if (existingMainStock) {
          oldMainStock = existingMainStock.currentStock || 0;
        }

        const mainStock = await increaseStock({
          Model: MainStoreStock,
          findQuery: {
            mainStoreRef: challan.toMainStoreRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
          session,
        });

        await createStockTransaction({
          itemRef: item.itemRef,
          mainStoreRef: challan.toMainStoreRef,
          transactionType: "CHALLAN_RECEIVED_SITE",
          direction: "IN",
          quantity: qty,
          beforeStock: oldMainStock,
          afterStock: mainStock.currentStock,
          rate,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Returned stock added to main store after MRS approval",
          createdBy: req.user?._id || null,
          session,
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

      /* ISTN: Site Store -> Site Store */
      if (challan.documentType === "ISTN") {
        const fromSiteStock = await SiteStoreStock.findById(item.fromStockRef).session(session);
        if (!fromSiteStock) throw new Error(`${item.itemName} source site stock not found`);

        const oldFromSiteStock = fromSiteStock.currentStock || 0;
        const oldFromSiteReserved = fromSiteStock.reservedStock || 0;

        await deductReservedStock({ stock: fromSiteStock, qty });

        await createStockTransaction({
          itemRef: item.itemRef,
          siteRef: challan.fromSiteRef,
          transactionType: "CHALLAN_APPROVED_OUT",
          direction: "OUT",
          quantity: qty,
          beforeStock: oldFromSiteStock,
          afterStock: fromSiteStock.currentStock,
          beforeReservedStock: oldFromSiteReserved,
          afterReservedStock: fromSiteStock.reservedStock,
          rate,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Stock deducted from source site after ISTN approval",
          createdBy: req.user?._id || null,
          session,
        });

        let oldToSiteStock = 0;

        const existingToSiteStock = await SiteStoreStock.findOne({
          siteRef: challan.toSiteRef,
          itemRef: item.itemRef,
        }).session(session);

        if (existingToSiteStock) {
          oldToSiteStock = existingToSiteStock.currentStock || 0;
        }

        const toSiteStock = await increaseStock({
          Model: SiteStoreStock,
          findQuery: {
            siteRef: challan.toSiteRef,
            itemRef: item.itemRef,
          },
          qty,
          rate,
          session,
        });

        await createStockTransaction({
          itemRef: item.itemRef,
          siteRef: challan.toSiteRef,
          transactionType: "CHALLAN_RECEIVED_SITE",
          direction: "IN",
          quantity: qty,
          beforeStock: oldToSiteStock,
          afterStock: toSiteStock.currentStock,
          rate,
          referenceType: "CHALLAN",
          referenceId: challan._id,
          referenceNumber: challan.documentNumber,
          remarks: "Stock added to destination site after ISTN approval",
          createdBy: req.user?._id || null,
          session,
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


    // MRQ final issued update after challan approval
    if (challan.materialRequisitionRef) {
      const mrq = await MaterialRequisition.findById(
        challan.materialRequisitionRef
      ).session(session);

      if (mrq) {
        for (const challanItem of challan.items) {
          const mrqItem = mrq.items.find(
            (x) => x.itemRef.toString() === challanItem.itemRef.toString()
          );

          if (mrqItem) {
            mrqItem.issuedQty =
              Number(mrqItem.issuedQty || 0) + Number(challanItem.quantity || 0);
          }
        }

        const allIssued = mrq.items.every(
          (item) =>
            Number(item.issuedQty || 0) >=
            Number(item.approvedQty || item.requiredQty || 0)
        );

        const anyIssued = mrq.items.some(
          (item) => Number(item.issuedQty || 0) > 0
        );

        mrq.status = allIssued
          ? "ISSUED"
          : anyIssued
            ? "PARTIAL_ISSUED"
            : mrq.status;

        await mrq.save({ session });
      }
    }

    // PP final completion update after challan approval
    if (challan.procurementPlanRef) {
      const plan = await ProcurementPlan.findById(
        challan.procurementPlanRef
      ).session(session);

      if (plan) {
        const idsToUpdate =
          Array.isArray(challan.procurementItemIds) &&
            challan.procurementItemIds.length > 0
            ? challan.procurementItemIds
            : challan.procurementItemId
              ? [challan.procurementItemId]
              : [];

        for (const id of idsToUpdate) {
          const planItem = plan.items.id(id);

          if (planItem) {
            planItem.executionStatus = "COMPLETED";
          }
        }

        const allCompleted = plan.items.every(
          (item) => item.executionStatus === "COMPLETED"
        );

        const anyProgress = plan.items.some((item) =>
          ["CHALLAN_CREATED", "COMPLETED"].includes(item.executionStatus)
        );

        plan.status = allCompleted
          ? "COMPLETED"
          : anyProgress
            ? "IN_PROGRESS"
            : "PENDING";

        await plan.save({ session });
      }
    }

    //MRQ & PP Update end 

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


  const canRejectChallan = [
    "Super Admin",
    "Admin",
    "Project Manager",
    "Store Manager",
    "MIS User"
  ].includes(req.user.role);

  if (!canRejectChallan) {
    return res.status(403).json({
      success: false,
      message: "Access Denied",
    });
  }
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

      const qty = cleanNumber(item.quantity);

      const StockModel =
        challan.documentType === "DC" ? MainStoreStock : SiteStoreStock;

      const stock = await StockModel.findById(item.fromStockRef).session(session);

      if (!stock) continue;

      const oldCurrentStock = stock.currentStock || 0;
      const oldReservedStock = stock.reservedStock || 0;

      await releaseReservedStock({
        stock,
        qty,
      });

      await createStockTransaction({
        itemRef: item.itemRef,

        mainStoreRef:
          challan.documentType === "DC" ? challan.fromMainStoreRef : null,

        siteRef:
          challan.documentType !== "DC" ? challan.fromSiteRef : null,

        transactionType: "CHALLAN_REJECT_RELEASE",
        direction: "RELEASE",

        quantity: qty,

        beforeStock: oldCurrentStock,
        afterStock: stock.currentStock,

        beforeReservedStock: oldReservedStock,
        afterReservedStock: stock.reservedStock,

        rate: stock.averageRate || item.rate || 0,

        referenceType: "CHALLAN",
        referenceId: challan._id,
        referenceNumber: challan.documentNumber,

        remarks: rejectionReason || "Reserved stock released after challan rejection",
        createdBy: req.user?._id || null,
        session,
      });
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

    const canGetsChallan = [
      "Super Admin",
      "Admin",
      "Project Manager",
      "Store Manager",
      "MIS User"
    ].includes(req.user.role);

    if (!canGetsChallan) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }
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
      .populate("projectRef", "name allotedCompany consigneeAddress consigneeName gstNumber placeOfDelivery")
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

/*  Item Picker  */
exports.getChallanPickerItems = async (req, res) => {
  try {
    const {
      documentType,
      fromMainStoreRef,
      fromSiteRef,
      search = "",
      category = "All",
      page = 1,
      limit = 20,
    } = req.query;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const itemMatch = {};

    if (search) {
      itemMatch.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
        { hsnCode: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { specification: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      itemMatch.category = category;
    }

    let data = [];
    let total = 0;

    // DC / CN = source is main store stock
    if (["DC", "CN"].includes(documentType)) {
      if (!fromMainStoreRef) {
        return res.status(400).json({
          success: false,
          message: "From main store is required",
        });
      }

      const stocks = await MainStoreStock.find({
        mainStoreRef: fromMainStoreRef,
        isActive: true,
        availableStock: { $gt: 0 },
      })
        .populate({
          path: "itemRef",
          match: itemMatch,
          select:
            "itemName itemCode category subCategory unit hsnCode brand make specification description",
        })
        .sort({ updatedAt: -1 });

      const filtered = stocks.filter((s) => s.itemRef);
      total = filtered.length;
      data = filtered.slice(skip, skip + Number(limit));
    }

    // ISTN / MRS = source is site store stock
    else if (["ISTN", "MRS"].includes(documentType)) {
      if (!fromSiteRef) {
        return res.status(400).json({
          success: false,
          message: "From site is required",
        });
      }

      const stocks = await SiteStoreStock.find({
        siteRef: fromSiteRef,
        isActive: true,
        availableStock: { $gt: 0 },
      })
        .populate({
          path: "itemRef",
          match: itemMatch,
          select:
            "itemName itemCode category subCategory unit hsnCode brand make specification description",
        })
        .sort({ updatedAt: -1 });

      const filtered = stocks.filter((s) => s.itemRef);
      total = filtered.length;
      data = filtered.slice(skip, skip + Number(limit));
    }

    // DDC / LPN / MRN = no source stock, select item master
    else if (["DDC", "LPN", "MRN"].includes(documentType)) {
      const query = {
        isActive: true,
        ...itemMatch,
      };

      total = await ItemIdentity.countDocuments(query);

      data = await ItemIdentity.find(query)
        .sort({ itemName: 1 })
        .skip(skip)
        .limit(Number(limit));
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data,
    });
  } catch (error) {
    console.error("Challan Picker Items Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch picker items",
      error: error.message,
    });
  }
};