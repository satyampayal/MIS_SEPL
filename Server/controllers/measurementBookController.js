const mongoose = require("mongoose");
const MeasurementBookEntry = require("../model/measurementBookEntry");
const BOQItem = require("../model/boqItem");
const Contractor = require("../model/contractor");


exports.createMBEntry = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const {
            projectRef,
            boqItemRef,
            contractorRef,
            measurementDate,
            executedByType,
            todayQty,
            location,
            floor,
            area,
            remarks,
        } = req.body;

        if (!projectRef || !boqItemRef || !measurementDate || !executedByType) {
            return res.status(400).json({
                success: false,
                message: "Project, BOQ item, date and executed by type are required",
            });
        }

        if (Number(todayQty || 0) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Today quantity must be greater than 0",
            });
        }

        if (executedByType === "CONTRACTOR" && !contractorRef) {
            return res.status(400).json({
                success: false,
                message: "Contractor is required for contractor execution",
            });
        }

        const boqItem = await BOQItem.findById(boqItemRef).session(session);
        // console.log(executedByType)
        // console.log(boqItem);

        if (!boqItem) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const previousQty = Number(boqItem.completedQty || 0);
        const qty = Number(todayQty || 0);

        if (previousQty + qty > Number(boqItem.poQty || 0)) {
            return res.status(400).json({
                success: false,
                message: "Today quantity exceeds BOQ balance quantity",
            });
        }

        const rate =
            executedByType === "CONTRACTOR"
                ? Number(boqItem.contractorInstallationRate || 0)
                : Number(boqItem?.installationRate || 0);
                console.log(rate)
                console.log( Number(boqItem?.installationRate || 0))
        const entry = await MeasurementBookEntry.create(
            [
                {
                    projectRef,
                    boqItemRef,
                    contractorRef: executedByType === "CONTRACTOR" ? contractorRef : null,
                    measurementDate,
                    executedByType,

                    previousQty,
                    todayQty: qty,
                    totalQty: previousQty + qty,
                    balanceQty: Number(boqItem.poQty || 0) - (previousQty + qty),

                    uom: boqItem.uom || "",
                    rate:rate,
                    amount: qty * rate,

                    location: location || "",
                    floor: floor || "",
                    area: area || "",
                    remarks: remarks || "",

                    approvalStatus: "DRAFT",
                    billStatus: executedByType === "SEPL" ? "NOT_BILLABLE" : "UNBILLED",

                    createdBy: req.user?._id || null,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "MB entry created as draft",
            entry: entry[0],
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Create MB Entry Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create MB entry",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

//  Bulk ENtery 
exports.createBulkMBEntries = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      projectRef,
      contractorRef,
      measurementDate,
      executedByType,
      location,
      floor,
      area,
      remarks,
      items = [],
    } = req.body;

    if (!projectRef || !measurementDate || !executedByType) {
      return res.status(400).json({
        success: false,
        message: "Project, date and executed by type are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one BOQ item is required",
      });
    }

    if (executedByType === "CONTRACTOR" && !contractorRef) {
      return res.status(400).json({
        success: false,
        message: "Contractor is required for contractor execution",
      });
    }

    const createdEntries = [];

    for (const row of items) {
      const qty = Number(row.todayQty || 0);

      if (!row.boqItemRef || qty <= 0) continue;

      const boqItem = await BOQItem.findById(row.boqItemRef).session(session);

      if (!boqItem) {
        throw new Error("BOQ item not found");
      }

      const previousQty = Number(boqItem.completedQty || 0);

      if (previousQty + qty > Number(boqItem.poQty || 0)) {
        throw new Error(
          `${boqItem.activity || boqItem.generalName || "BOQ item"} exceeds balance quantity`
        );
      }

      const rate =
        executedByType === "CONTRACTOR"
          ? Number(boqItem.contractorInstallationRate || 0)
          : Number(boqItem.installationRate || 0);

      const entry = await MeasurementBookEntry.create(
        [
          {
            projectRef,
            boqItemRef: boqItem._id,
            contractorRef:
              executedByType === "CONTRACTOR" ? contractorRef : null,

            measurementDate,
            executedByType,

            previousQty,
            todayQty: qty,
            totalQty: previousQty + qty,
            balanceQty: Number(boqItem.poQty || 0) - (previousQty + qty),

            uom: boqItem.uom || "",
            rate,
            amount: qty * rate,

            location: location || "",
            floor: floor || "",
            area: area || "",
            remarks: row.remarks || remarks || "",

            approvalStatus: "DRAFT",
            billStatus:
              executedByType === "SEPL" ? "NOT_BILLABLE" : "UNBILLED",

            createdBy: req.user?._id || null,
          },
        ],
        { session }
      );

      createdEntries.push(entry[0]);
    }

    if (createdEntries.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "No valid MB items found",
      });
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: `${createdEntries.length} MB draft entries created`,
      entries: createdEntries,
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: "Failed to create bulk MB entries",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getMBEntries = async (req, res) => {
    try {
        const {
            projectRef,
            contractorRef,
            boqItemRef,
            approvalStatus,
            executedByType,
            fromDate,
            toDate,
        } = req.query;

        const filter = {};

        if (projectRef) filter.projectRef = projectRef;
        if (contractorRef) filter.contractorRef = contractorRef;
        if (boqItemRef) filter.boqItemRef = boqItemRef;
        if (approvalStatus) filter.approvalStatus = approvalStatus;
        if (executedByType) filter.executedByType = executedByType;

        if (fromDate || toDate) {
            filter.measurementDate = {};
            if (fromDate) filter.measurementDate.$gte = new Date(fromDate);
            if (toDate) filter.measurementDate.$lte = new Date(toDate);
        }

        const entries = await MeasurementBookEntry.find(filter)
            .populate("projectRef", "projectName name")
            .populate("contractorRef", "contractorName mobile")
            .populate(
                "boqItemRef",
                "boqItemCode boqSrNo activity generalName description uom poQty completedQty balanceQty contractorInstallationRate installationRate"
            )
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email")
            .sort({ measurementDate: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: entries.length,
            entries,
        });
    } catch (error) {
        console.error("Get MB Entries Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch MB entries",
            error: error.message,
        });
    }
};

exports.submitMBEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await MeasurementBookEntry.findById(id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "MB entry not found",
            });
        }

        if (entry.approvalStatus !== "DRAFT" && entry.approvalStatus !== "REJECTED") {
            return res.status(400).json({
                success: false,
                message: "Only draft or rejected MB entry can be submitted",
            });
        }

        entry.approvalStatus = "PENDING";
        entry.updatedBy = req.user?._id || null;

        await entry.save();

        return res.status(200).json({
            success: true,
            message: "MB entry submitted for approval",
            entry,
        });
    } catch (error) {
        console.error("Submit MB Entry Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit MB entry",
            error: error.message,
        });
    }
};

exports.approveMBEntry = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { id } = req.params;

        const entry = await MeasurementBookEntry.findById(id).session(session);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "MB entry not found",
            });
        }

        if (entry.approvalStatus !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Only pending MB entry can be approved",
            });
        }

        const boqItem = await BOQItem.findById(entry.boqItemRef).session(session);

        if (!boqItem) {
            return res.status(404).json({
                success: false,
                message: "Linked BOQ item not found",
            });
        }

        const newCompletedQty =
            Number(boqItem.completedQty || 0) + Number(entry.todayQty || 0);

        if (newCompletedQty > Number(boqItem.poQty || 0)) {
            return res.status(400).json({
                success: false,
                message: "Approval failed: quantity exceeds BOQ quantity",
            });
        }

        boqItem.completedQty = newCompletedQty;
        boqItem.approvedQty =
            Number(boqItem.approvedQty || 0) + Number(entry.todayQty || 0);
        boqItem.balanceQty = Math.max(
            Number(boqItem.poQty || 0) - Number(boqItem.completedQty || 0),
            0
        );

        await boqItem.save({ session });

        entry.approvalStatus = "APPROVED";
        entry.approvedBy = req.user?._id || null;
        entry.approvedAt = new Date();
        entry.updatedBy = req.user?._id || null;

        await entry.save({ session });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "MB entry approved and BOQ progress updated",
            entry,
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Approve MB Entry Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to approve MB entry",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

exports.rejectMBEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required",
            });
        }

        const entry = await MeasurementBookEntry.findById(id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "MB entry not found",
            });
        }

        if (entry.approvalStatus !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Only pending MB entry can be rejected",
            });
        }

        entry.approvalStatus = "REJECTED";
        entry.rejectionReason = rejectionReason;
        entry.updatedBy = req.user?._id || null;

        await entry.save();

        return res.status(200).json({
            success: true,
            message: "MB entry rejected",
            entry,
        });
    } catch (error) {
        console.error("Reject MB Entry Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject MB entry",
            error: error.message,
        });
    }
};

exports.getMBBoqPickerItems = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { contractorRef, search = "" } = req.query;

        const filter = {
            projectRef: projectId,
            status: "ACTIVE",
            balanceQty: { $gt: 0 },
        };

        if (contractorRef) {
            filter.contractorRef = contractorRef;
        }

        if (search) {
            filter.$or = [
                { activity: { $regex: search, $options: "i" } },
                { generalName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { boqItemCode: { $regex: search, $options: "i" } },
                { boqSrNo: { $regex: search, $options: "i" } },
                { aliases: { $regex: search, $options: "i" } },
                { keywords: { $regex: search, $options: "i" } },
            ];
        }

        const items = await BOQItem.find(filter)
            .select(
                "boqItemCode boqSrNo activity generalName description uom poQty completedQty approvedQty billedQty balanceQty contractorInstallationRate installationRate contractorRef"
            )
            .populate("contractorRef", "contractorName mobile")
            .sort({ boqSrNo: 1, sourceRowNumber: 1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            count: items.length,
            items,
        });
    } catch (error) {
        console.error("Get MB BOQ Picker Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch BOQ picker items",
            error: error.message,
        });
    }
};


exports.getSingleMBEntry = async (req, res) => {
    try {
        const entry = await MeasurementBookEntry.findById(req.params.id)
            .populate("projectRef")
            .populate("contractorRef")
            .populate("boqItemRef");

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "MB entry not found",
            });
        }

        return res.status(200).json({
            success: true,
            entry,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch MB entry",
            error: error.message,
        });
    }
};


exports.updateMBEntry = async (req, res) => {
    try {
        const entry = await MeasurementBookEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "MB entry not found",
            });
        }

        if (
            entry.approvalStatus !== "DRAFT" &&
            entry.approvalStatus !== "REJECTED"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only draft or rejected entry can be edited",
            });
        }

        const payload = { ...req.body };

        if (!payload.contractorRef || payload.executedByType === "SEPL") {
            payload.contractorRef = null;
        }

        payload.todayQty = Number(payload.todayQty || 0);
        payload.updatedBy = req.user?._id || null;

        Object.assign(entry, payload);

        entry.updatedBy = req.user?._id;

        await entry.save();

        return res.status(200).json({
            success: true,
            message: "MB updated successfully",
            entry,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update MB",
            error: error.message,
        });
    }
};


exports.deleteMBEntry = async (req, res) => {
    try {
        const entry = await MeasurementBookEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "MB entry not found",
            });
        }

        if (
            entry.approvalStatus !== "DRAFT" &&
            entry.approvalStatus !== "REJECTED"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only draft or rejected entry can be deleted",
            });
        }

        await entry.deleteOne();

        return res.status(200).json({
            success: true,
            message: "MB deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete MB",
            error: error.message,
        });
    }
};