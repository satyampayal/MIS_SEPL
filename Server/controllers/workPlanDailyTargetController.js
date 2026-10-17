
const mongoose = require("mongoose");

const WorkPlan = require("../model/workPlan");
const WorkPlanDailyTarget = require("../model/workPlanDailyTarget");
const MeasurementBookEntry = require("../model/MeasurementBookEntry");

const getUserId = (req) => req.user?._id || req.user?.id;

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const getMonthRange = (month) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
        return null;
    }

    const [year, monthNumber] = month.split("-").map(Number);

    return {
        start: new Date(Date.UTC(year, monthNumber - 1, 1)),
        end: new Date(Date.UTC(year, monthNumber, 1)),
    };
};

const normalizeDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return date;
};

// GET /api/work-plans/:id/daily-targets?month=2026-10

exports.getDailyTargets = async (req, res) => {
    try {
        const { id } = req.params;
        const range = getMonthRange(req.query.month);

        if (!validId(id) || !range) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid Work Plan ID and month (YYYY-MM).",
            });
        }

        const plan = await WorkPlan.findById(id).lean();

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Work Plan not found.",
            });
        }

        const targets = await WorkPlanDailyTarget.find({
            workPlanRef: plan._id,
            targetDate: {
                $gte: range.start,
                $lt: range.end,
            },
        })
            .populate("boqItemRef")
            .sort({ targetDate: 1 });

        const actualRows = await MeasurementBookEntry.aggregate([
            {
                $match: {
                    projectRef: plan.projectRef,
                    measurementDate: {
                        $gte: range.start,
                        $lt: range.end,
                    },
                    approvalStatus: "APPROVED",
                    boqItemRef: {
                        $in: plan.planItemList.map(
                            (item) => item.boqItemRef
                        ),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        boqItemRef: "$boqItemRef",
                        day: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$measurementDate",
                                timezone: "UTC",
                            },
                        },
                    },
                    actualQty: { $sum: "$todayQty" },
                },
            },
        ]);

        const actualMap = new Map(
            actualRows.map((row) => [
                `${row._id.boqItemRef}_${row._id.day}`,
                row.actualQty,
            ])
        );

        const data = targets.map((target) => {
            const day = target.targetDate.toISOString().slice(0, 10);
            const key = `${target.boqItemRef._id}_${day}`;
            const actualQty = actualMap.get(key) || 0;

            return {
                ...target.toObject(),
                actualQty,
                remainingQty: Math.max(
                    target.targetQty - actualQty,
                    0
                ),
                achievementPercent:
                    target.targetQty > 0
                        ? Number(
                              (
                                  (actualQty / target.targetQty) *
                                  100
                              ).toFixed(2)
                          )
                        : null,
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                workPlanRef: plan._id,
                month: req.query.month,
                targets: data,
            },
        });
    } catch (error) {
        console.error("Get Daily Targets Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch daily targets.",
            error: error.message,
        });
    }
};

// PUT /api/work-plans/:id/daily-targets
//
// Body:
// {
//   "month": "2026-10",
//   "targets": [
//     {
//       "boqItemRef": "...",
//       "targetDate": "2026-10-15",
//       "targetQty": 20,
//       "remarks": ""
//     }
//   ]
// }
//
// The submitted list replaces the schedule for that month only.

exports.saveDailyTargets = async (req, res) => {
    try {
        const { id } = req.params;
        const { month, targets } = req.body;
        const range = getMonthRange(month);
        const userId = getUserId(req);

        if (!validId(id) || !range) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid Work Plan ID and month.",
            });
        }

        if (!userId || !validId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found.",
            });
        }

        if (!Array.isArray(targets)) {
            return res.status(400).json({
                success: false,
                message: "Targets must be an array.",
            });
        }

        const plan = await WorkPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Work Plan not found.",
            });
        }

        if (plan.status !== "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "Approve the Work Plan before scheduling daily targets.",
            });
        }

        if (
            range.start < new Date(plan.planStartDate).setUTCHours(0, 0, 0, 0) ||
            range.end > new Date(
                Date.UTC(
                    new Date(plan.planEndDate).getUTCFullYear(),
                    new Date(plan.planEndDate).getUTCMonth(),
                    new Date(plan.planEndDate).getUTCDate() + 1
                )
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "The selected month falls outside the Work Plan dates.",
            });
        }

        const allowedItems = new Map(
            plan.planItemList.map((item) => [
                String(item.boqItemRef),
                Number(item.planQty),
            ])
        );

        const normalized = [];
        const uniqueKeys = new Set();
        const quantityByItem = new Map();

        for (const target of targets) {
            const itemId = String(target.boqItemRef || "");
            const targetDate = normalizeDate(target.targetDate);
            const qty = Number(target.targetQty);

            if (
                !validId(itemId) ||
                !allowedItems.has(itemId) ||
                !targetDate ||
                targetDate < range.start ||
                targetDate >= range.end ||
                targetDate < new Date(plan.planStartDate).setUTCHours(0, 0, 0, 0) ||
                targetDate > new Date(
                    Date.UTC(
                        new Date(plan.planEndDate).getUTCFullYear(),
                        new Date(plan.planEndDate).getUTCMonth(),
                        new Date(plan.planEndDate).getUTCDate()
                    )
                ) ||
                !Number.isFinite(qty) ||
                qty < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "A daily target has an invalid BOQ item, date, or quantity.",
                });
            }

            const dateKey = targetDate.toISOString().slice(0, 10);
            const uniqueKey = `${itemId}_${dateKey}`;

            if (uniqueKeys.has(uniqueKey)) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate target for the same BOQ item and date.",
                });
            }

            uniqueKeys.add(uniqueKey);
            quantityByItem.set(
                itemId,
                (quantityByItem.get(itemId) || 0) + qty
            );

            normalized.push({
                workPlanRef: plan._id,
                projectRef: plan.projectRef,
                boqItemRef: itemId,
                targetDate,
                targetQty: qty,
                remarks: target.remarks || "",
                updatedBy: userId,
                createdBy: userId,
            });
        }

        for (const [itemId, monthlyQty] of quantityByItem) {
            if (monthlyQty > allowedItems.get(itemId)) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Daily targets for BOQ item ${itemId} exceed its monthly planned quantity.`,
                });
            }
        }

        // Remove only this Work Plan's schedule for the selected month.
        // Previous and future months remain untouched.
        await WorkPlanDailyTarget.deleteMany({
            workPlanRef: plan._id,
            targetDate: {
                $gte: range.start,
                $lt: range.end,
            },
        });

        if (normalized.length) {
            await WorkPlanDailyTarget.insertMany(normalized);
        }

        const saved = await WorkPlanDailyTarget.find({
            workPlanRef: plan._id,
            targetDate: {
                $gte: range.start,
                $lt: range.end,
            },
        }).sort({ targetDate: 1 });

        return res.status(200).json({
            success: true,
            message: "Daily targets saved successfully.",
            data: saved,
        });
    } catch (error) {
        console.error("Save Daily Targets Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save daily targets.",
            error: error.message,
        });
    }
};
