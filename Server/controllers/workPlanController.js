
const mongoose = require("mongoose");

const WorkPlan = require("../model/workPlan");
const MeasurementBookEntry = require("../model/MeasurementBookEntry");

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const getUserId = (req) => req.user?._id || req.user?.id;

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

const getMonthRange = (month) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
        return null;
    }

    const [year, monthNumber] = month.split("-").map(Number);

    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));

    return { start, end };
};
const getDateKey = (date) => {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return "Unknown";
    }

    return value.toISOString().slice(0, 10);
};

const roundQty = (value) =>
    Number((Number(value) || 0).toFixed(3));

// --------------------------------------------------
// CREATE WORK PLAN
// POST /api/work-plans
// --------------------------------------------------

exports.createWorkPlan = async (req, res) => {
    try {
        const {
            projectRef,
            boqRef,
            planName,
            planStartDate,
            planEndDate,
            planDescription,
            planItemList,
        } = req.body;

        if (
            !projectRef ||
            !boqRef ||
            !planStartDate ||
            !planEndDate ||
            !Array.isArray(planItemList) ||
            planItemList.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Project, BOQ, plan dates and at least one BOQ item are required.",
            });
        }

        if (
            !isValidObjectId(projectRef) ||
            !isValidObjectId(boqRef)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project or BOQ ID.",
            });
        }

        const start = new Date(planStartDate);
        const end = new Date(planEndDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < start
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan dates.",
            });
        }

        // Prevent duplicate BOQ items within the same plan.
        const itemIds = planItemList.map((item) =>
            String(item.boqItemRef)
        );

        if (
            itemIds.some((id) => !isValidObjectId(id)) ||
            new Set(itemIds).size !== itemIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Every BOQ item must have a valid, unique BOQ item ID.",
            });
        }

        const items = planItemList.map((item) => ({
            boqItemRef: item.boqItemRef,
            planQty: Number(item.planQty),
            description: item.description || "",
            unit: item.unit || "",
            rate: Number(item.rate || 0),
            remarks: item.remarks || "",
        }));

        if (
            items.some(
                (item) =>
                    !Number.isFinite(item.planQty) ||
                    item.planQty < 0 ||
                    !Number.isFinite(item.rate) ||
                    item.rate < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Plan quantities and rates must be valid non-negative numbers.",
            });
        }

        const userId = getUserId(req);

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found.",
            });
        }

        // Replace with your existing numbering utility if available.
        const planNumber = `WP-${Date.now()}`;

        const workPlan = await WorkPlan.create({
            projectRef,
            boqRef,
            planName: planName || "",
            planNumber,
            planStartDate: start,
            planEndDate: end,
            planDescription: planDescription || "",
            planItemList: items,
            createdBy: userId,
            status: "DRAFT",
        });

        return res.status(201).json({
            success: true,
            message: "Work Plan created successfully.",
            data: workPlan,
        });
    } catch (error) {
        console.error("Create Work Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create Work Plan.",
            error: error.message,
        });
    }
};

// --------------------------------------------------
// GET ALL WORK PLANS
// GET /api/work-plans?projectRef=...&status=DRAFT
// --------------------------------------------------

exports.getWorkPlans = async (req, res) => {
    try {
        const { projectRef, boqRef, status } = req.query;

        const filter = {};

        if (projectRef) {
            if (!isValidObjectId(projectRef)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project ID.",
                });
            }

            filter.projectRef = projectRef;
        }

        if (boqRef) {
            if (!isValidObjectId(boqRef)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid BOQ ID.",
                });
            }

            filter.boqRef = boqRef;
        }

        if (status) {
            const allowedStatuses = [
                "DRAFT",
                "SUBMITTED",
                "APPROVED",
                "REJECTED",
                "REVISION_REQUESTED",
                "CLOSED",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Work Plan status.",
                });
            }

            filter.status = status;
        }

        const workPlans = await WorkPlan.find(filter)
            .populate("projectRef")
            .populate("boqRef")
            .populate("createdBy", "name email")
            .populate("reviewedBy", "name email")
            .sort({ planStartDate: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: workPlans.length,
            data: workPlans,
        });
    } catch (error) {
        console.error("Get Work Plans Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch Work Plans.",
            error: error.message,
        });
    }
};

// --------------------------------------------------
// GET SINGLE WORK PLAN
// GET /api/work-plans/:id
// --------------------------------------------------

exports.getWorkPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Work Plan ID.",
            });
        }

        const workPlan = await WorkPlan.findById(id)
            .populate("projectRef")
            .populate("boqRef")
            .populate("createdBy", "name email")
            .populate("reviewedBy", "name email");

        if (!workPlan) {
            return res.status(404).json({
                success: false,
                message: "Work Plan not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: workPlan,
        });
    } catch (error) {
        console.error("Get Work Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch Work Plan.",
            error: error.message,
        });
    }
};

// --------------------------------------------------
// UPDATE WORK PLAN
// PUT /api/work-plans/:id
// Only DRAFT / REVISION_REQUESTED plans can be edited.
// --------------------------------------------------

exports.updateWorkPlan = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Work Plan ID.",
            });
        }

        const workPlan = await WorkPlan.findById(id);

        if (!workPlan) {
            return res.status(404).json({
                success: false,
                message: "Work Plan not found.",
            });
        }

        if (
            !["DRAFT", "REVISION_REQUESTED"].includes(
                workPlan.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only DRAFT or REVISION_REQUESTED plans can be edited.",
            });
        }

        const {
            planName,
            planStartDate,
            planEndDate,
            planDescription,
            planItemList,
        } = req.body;

        const nextStart = planStartDate
            ? new Date(planStartDate)
            : workPlan.planStartDate;

        const nextEnd = planEndDate
            ? new Date(planEndDate)
            : workPlan.planEndDate;

        if (
            Number.isNaN(nextStart.getTime()) ||
            Number.isNaN(nextEnd.getTime()) ||
            nextEnd < nextStart
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan dates.",
            });
        }

        if (planItemList !== undefined) {
            if (
                !Array.isArray(planItemList) ||
                planItemList.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "At least one BOQ item is required.",
                });
            }

            const itemIds = planItemList.map((item) =>
                String(item.boqItemRef)
            );

            if (
                itemIds.some((id) => !isValidObjectId(id)) ||
                new Set(itemIds).size !== itemIds.length
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "BOQ item IDs must be valid and unique.",
                });
            }

            const items = planItemList.map((item) => ({
                boqItemRef: item.boqItemRef,
                planQty: Number(item.planQty),
                description: item.description || "",
                unit: item.unit || "",
                rate: Number(item.rate || 0),
                remarks: item.remarks || "",
            }));

            if (
                items.some(
                    (item) =>
                        !Number.isFinite(item.planQty) ||
                        item.planQty < 0 ||
                        !Number.isFinite(item.rate) ||
                        item.rate < 0
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Plan quantities and rates must be valid non-negative numbers.",
                });
            }

            workPlan.planItemList = items;
        }

        if (planName !== undefined) {
            workPlan.planName = planName;
        }

        if (planDescription !== undefined) {
            workPlan.planDescription = planDescription;
        }

        workPlan.planStartDate = nextStart;
        workPlan.planEndDate = nextEnd;

        // Clear old review decision when a rejected plan is revised.
        workPlan.reviewedBy = null;
        workPlan.reviewedAt = null;
        workPlan.reviewRemarks = "";

        await workPlan.save();

        return res.status(200).json({
            success: true,
            message: "Work Plan updated successfully.",
            data: workPlan,
        });
    } catch (error) {
        console.error("Update Work Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update Work Plan.",
            error: error.message,
        });
    }
};

// --------------------------------------------------
// SUBMIT WORK PLAN
// PATCH /api/work-plans/:id/submit
// --------------------------------------------------

exports.submitWorkPlan = async (req, res) => {
    try {
        const workPlan = await WorkPlan.findById(req.params.id);

        if (!workPlan) {
            return res.status(404).json({
                success: false,
                message: "Work Plan not found.",
            });
        }

        if (
            !["DRAFT", "REVISION_REQUESTED"].includes(
                workPlan.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "This Work Plan cannot be submitted in its current status.",
            });
        }

        workPlan.status = "SUBMITTED";
        workPlan.submittedAt = new Date();
        workPlan.reviewedBy = null;
        workPlan.reviewedAt = null;
        workPlan.reviewRemarks = "";

        await workPlan.save();

        return res.status(200).json({
            success: true,
            message: "Work Plan submitted for review.",
            data: workPlan,
        });
    } catch (error) {
        console.error("Submit Work Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit Work Plan.",
            error: error.message,
        });
    }
};

// --------------------------------------------------
// REVIEW WORK PLAN
// PATCH /api/work-plans/:id/review
// Body: { decision: "APPROVED" | "REJECTED" |
//         "REVISION_REQUESTED", remarks: "" }
// --------------------------------------------------

exports.reviewWorkPlan = async (req, res) => {
    try {
        const { decision, remarks = "" } = req.body;

        const allowedDecisions = [
            "APPROVED",
            "REJECTED",
            "REVISION_REQUESTED",
        ];

        if (!allowedDecisions.includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review decision.",
            });
        }

        const userId = getUserId(req);

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found.",
            });
        }

        const workPlan = await WorkPlan.findById(req.params.id);

        if (!workPlan) {
            return res.status(404).json({
                success: false,
                message: "Work Plan not found.",
            });
        }

        if (workPlan.status !== "SUBMITTED") {
            return res.status(400).json({
                success: false,
                message: "Only submitted Work Plans can be reviewed.",
            });
        }

        workPlan.status = decision;
        workPlan.reviewedBy = userId;
        workPlan.reviewedAt = new Date();
        workPlan.reviewRemarks = remarks;

        await workPlan.save();

        return res.status(200).json({
            success: true,
            message: `Work Plan ${decision.toLowerCase().replace("_", " ")} successfully.`,
            data: workPlan,
        });
    } catch (error) {
        console.error("Review Work Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to review Work Plan.",
            error: error.message,
        });
    }
};

// --------------------------------------------------
// MONTHLY WORK PLAN REPORT
// GET /api/work-plans/report/monthly
// Query: projectRef, month=YYYY-MM
// --------------------------------------------------

// exports.getMonthlyWorkPlanReport = async (req, res) => {
//     try {
//         const { projectRef, month } = req.query;

//         if (!projectRef || !isValidObjectId(projectRef)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "A valid projectRef is required.",
//             });
//         }

//         const range = getMonthRange(month);

//         if (!range) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Month must use YYYY-MM format, for example 2026-10.",
//             });
//         }

//         const { start, end } = range;

//         // Treat each Work Plan as a monthly plan:
//         // its start date must fall within the requested month.
//         const plans = await WorkPlan.find({
//             projectRef,
//             status: "APPROVED",
//             planStartDate: {
//                 $gte: start,
//                 $lt: end,
//             },
//         }).lean();

//         const allItems = plans.flatMap((plan) =>
//             plan.planItemList.map((item) => ({
//                 planId: plan._id,
//                 planNumber: plan.planNumber,
//                 planName: plan.planName,
//                 boqRef: plan.boqRef,
//                 planItem: item,
//             }))
//         );

//         const itemIds = [
//             ...new Set(
//                 allItems.map((entry) =>
//                     String(entry.planItem.boqItemRef)
//                 )
//             ),
//         ].map((id) => new mongoose.Types.ObjectId(id));

//         const actualRows = itemIds.length
//             ? await MeasurementBookEntry.aggregate([
//                   {
//                       $match: {
//                           projectRef: new mongoose.Types.ObjectId(
//                               projectRef
//                           ),
//                           boqItemRef: { $in: itemIds },
//                           measurementDate: {
//                               $gte: start,
//                               $lt: end,
//                           },
//                           approvalStatus: "APPROVED",
//                       },
//                   },
//                   {
//                       $group: {
//                           _id: "$boqItemRef",
//                           actualQty: { $sum: "$todayQty" },
//                           seplQty: {
//                               $sum: {
//                                   $cond: [
//                                       { $eq: ["$executedByType", "SEPL"] },
//                                       "$todayQty",
//                                       0,
//                                   ],
//                               },
//                           },
//                           contractorQty: {
//                               $sum: {
//                                   $cond: [
//                                       {
//                                           $eq: [
//                                               "$executedByType",
//                                               "CONTRACTOR",
//                                           ],
//                                       },
//                                       "$todayQty",
//                                       0,
//                                   ],
//                               },
//                           },
//                       },
//                   },
//               ])
//             : [];

//         const actualMap = new Map(
//             actualRows.map((row) => [
//                 String(row._id),
//                 {
//                     actualQty: row.actualQty || 0,
//                     seplQty: row.seplQty || 0,
//                     contractorQty: row.contractorQty || 0,
//                 },
//             ])
//         );

//         const reportItems = allItems.map((entry) => {
//             const key = String(entry.planItem.boqItemRef);

//             const actual = actualMap.get(key) || {
//                 actualQty: 0,
//                 seplQty: 0,
//                 contractorQty: 0,
//             };

//             const target = Number(entry.planItem.planQty || 0);
//             const actualQty = actual.actualQty;

//             return {
//                 planId: entry.planId,
//                 planNumber: entry.planNumber,
//                 boqRef: entry.boqRef,
//                 boqItemRef: entry.planItem.boqItemRef,
//                 description: entry.planItem.description,
//                 unit: entry.planItem.unit,
//                 plannedQty: target,
//                 actualQty,
//                 seplQty: actual.seplQty,
//                 contractorQty: actual.contractorQty,
//                 remainingQty: Math.max(target - actualQty, 0),
//                 shortfallQty: Math.max(target - actualQty, 0),
//                 achievementPercent:
//                     target > 0
//                         ? Number(((actualQty / target) * 100).toFixed(2))
//                         : null,
//             };
//         });

//         const totals = reportItems.reduce(
//             (acc, item) => {
//                 acc.plannedQty += item.plannedQty;
//                 acc.actualQty += item.actualQty;
//                 acc.seplQty += item.seplQty;
//                 acc.contractorQty += item.contractorQty;
//                 acc.remainingQty += item.remainingQty;
//                 acc.shortfallQty += item.shortfallQty;
//                 return acc;
//             },
//             {
//                 plannedQty: 0,
//                 actualQty: 0,
//                 seplQty: 0,
//                 contractorQty: 0,
//                 remainingQty: 0,
//                 shortfallQty: 0,
//             }
//         );

//         totals.achievementPercent =
//             totals.plannedQty > 0
//                 ? Number(
//                       (
//                           (totals.actualQty / totals.plannedQty) *
//                           100
//                       ).toFixed(2)
//                   )
//                 : null;

//         return res.status(200).json({
//             success: true,
//             message: "Monthly Work Plan report generated.",
//             data: {
//                 projectRef,
//                 month,
//                 periodStart: start,
//                 periodEndExclusive: end,
//                 approvedPlanCount: plans.length,
//                 totals,
//                 items: reportItems,
//             },
//         });
//     } catch (error) {
//         console.error("Monthly Work Plan Report Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to generate monthly Work Plan report.",
//             error: error.message,
//         });
//     }
// };


exports.getMonthlyWorkPlanReport = async (req, res) => {
    try {
        const { projectRef, month } = req.query;

        if (!projectRef || !isValidObjectId(projectRef)) {
            return res.status(400).json({
                success: false,
                message: "A valid projectRef is required.",
            });
        }

        const range = getMonthRange(month);

        if (!range) {
            return res.status(400).json({
                success: false,
                message:
                    "Month must use YYYY-MM format, for example 2026-10.",
            });
        }

        const { start, end } = range;
        const projectObjectId =
            new mongoose.Types.ObjectId(projectRef);

        // Keep the existing report's rule:
        // only approved Work Plans starting in the selected month.
        const plans = await WorkPlan.find({
            projectRef: projectObjectId,
            status: "APPROVED",
            planStartDate: {
                $gte: start,
                $lt: end,
            },
        })
            .select(
                "_id planNumber planName boqRef planStartDate planEndDate planItemList"
            )
            .lean();

        // Combine plan quantities by BOQ item.
        // This ensures the same MB achievement is not repeated
        // once for every Work Plan containing the same item.
        const itemMap = new Map();

        for (const plan of plans) {
            for (const planItem of plan.planItemList || []) {
                if (!planItem.boqItemRef) continue;

                const key = String(planItem.boqItemRef);

                if (!itemMap.has(key)) {
                    itemMap.set(key, {
                        boqItemRef: planItem.boqItemRef,
                        boqRef: plan.boqRef,
                        description: planItem.description || "",
                        unit: planItem.unit || "",
                        rate: Number(planItem.rate),
                        plannedAmount:0,
                        plannedQty:0,
                        plans: [],
                    });
                }

                const item = itemMap.get(key);

                item.plannedQty += Number(planItem.planQty || 0);
                item.plannedAmount +=
                    Number(planItem.planQty || 0) *
                    Number(planItem.rate ?? item.rate ?? 0);
                    // console.log("Planned Amount ",item.plannedAmount);

                item.plans.push({
                    planId: plan._id,
                    planNumber: plan.planNumber || "",
                    planName: plan.planName || "",
                    planQty: Number(planItem.planQty || 0),
                });

                // Prefer an available description/unit if the
                // first matching plan did not provide one.
                if (!item.description && planItem.description) {
                    item.description = planItem.description;
                }

                if (!item.unit && planItem.unit) {
                    item.unit = planItem.unit;
                }

                // console.log(item)
            }
        }


        const itemIds = [...itemMap.keys()].map(
            (id) => new mongoose.Types.ObjectId(id)
        );

        // Fetch individual approved MB entries.
        // Use todayQty, NOT totalQty, to avoid counting cumulative
        // quantities repeatedly.
        const mbEntries = await MeasurementBookEntry.find({
            projectRef: projectObjectId,
            //   boqItemRef: { $in: itemIds },
            measurementDate: {
                $gte: start,
                $lt: end,
            },
            approvalStatus: "APPROVED",
        })
            .select(
                "_id projectRef boqItemRef contractorRef dprRef measurementDate executedByType todayQty uom rate amount manPowerCount teamName location floor area remarks approvalStatus"
            )
            .sort({ measurementDate: 1, createdAt: 1 })
            .lean()


        // Aggregate actuals once per BOQ item and preserve
        // individual MB entries for the detailed report.
        const actualMap = new Map();

        // Company/project-wide day-wise totals.
        const overallDayMap = new Map();

        for (const entry of mbEntries) {
            const itemKey = String(entry.boqItemRef);
            const dateKey = getDateKey(entry.measurementDate);
            const qty = Number(entry.todayQty || 0);
            const isSEPL = entry.executedByType === "SEPL";
            const rate = Number(entry.rate || 0);

            const amount =
                entry.amount != null
                    ? Number(entry.amount)
                    : Number(entry.todayQty || 0) * rate;

            if (!actualMap.has(itemKey)) {
                actualMap.set(itemKey, {
                    actualQty: 0,
                    seplQty: 0,
                    contractorQty: 0,
                    actualAmount: 0,
                    seplAmount: 0,
                    contractorAmount: 0,
                    dailyMap: new Map(),
                });
            }

            const actual = actualMap.get(itemKey);

            actual.actualQty += qty;
            actual.actualAmount += amount;

            if (isSEPL) {
                actual.seplQty += qty;
                actual.seplAmount += amount;
            } else if (entry.executedByType === "CONTRACTOR") {
                actual.contractorQty += qty;
                actual.contractorAmount += amount;
            }

            if (!actual.dailyMap.has(dateKey)) {
                actual.dailyMap.set(dateKey, {
                    date: dateKey,
                    actualQty: 0,
                    seplQty: 0,
                    contractorQty: 0,
                    entries: [],
                });
            }

            const daily = actual.dailyMap.get(dateKey);

            daily.actualQty += qty;


            if (isSEPL) {
                daily.seplQty += qty;
            } else if (entry.executedByType === "CONTRACTOR") {
                daily.contractorQty += qty;
            }

            // Detailed third-page breakup.
            daily.entries.push({
                mbEntryId: entry._id,
                measurementDate: dateKey,
                boqItemRef: entry.boqItemRef,
                executedByType: entry.executedByType,
                contractorRef: entry.contractorRef || null,
                todayQty: roundQty(qty),
                unit: entry.uom || "",
                rate: Number(entry.rate || 0),
                amount: Number(entry.amount || 0),
                teamName: entry.teamName || "",
                manPowerCount: Number(entry.manPowerCount || 0),
                location: entry.location || "",
                floor: entry.floor || "",
                area: entry.area || "",
                dprRef: entry.dprRef || null,
                remarks: entry.remarks || "",
            });

            // Also build the overall daily achievement across
            // all report materials.
            if (!overallDayMap.has(dateKey)) {
                overallDayMap.set(dateKey, {
                    date: dateKey,
                    actualQty: 0,
                    seplQty: 0,
                    contractorQty: 0,
                    entryCount: 0,
                });
            }

            const overallDay = overallDayMap.get(dateKey);

            overallDay.actualQty += qty;
            overallDay.entryCount += 1;

            if (isSEPL) {
                overallDay.seplQty += qty;
            } else if (entry.executedByType === "CONTRACTOR") {
                overallDay.contractorQty += qty;
            }
        }

        // One report item per BOQ item.
        let  targetAmount=0;
        const reportItems = [...itemMap.entries()].map(
            ([key, item]) => {
                const actual = actualMap.get(key) || {
                    actualQty: 0,
                    seplQty: 0,
                    contractorQty: 0,
                    dailyMap: new Map(),
                };

                const plannedQty = Number(item.plannedQty || 0);
                const actualQty = Number(actual.actualQty || 0);
                 targetAmount=Number(item.plannedAmount||0);

                const dailyBreakup = [
                    ...actual.dailyMap.values(),
                ]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((day) => ({
                        ...day,
                        actualQty: roundQty(day.actualQty),
                        seplQty: roundQty(day.seplQty),
                        contractorQty: roundQty(day.contractorQty),
                        entries: day.entries,
                    }));

                return {
                    // Compatibility fields for the existing frontend.
                    planId: item.plans[0]?.planId || null,
                    planNumber: item.plans[0]?.planNumber || "",
                    planNumbers: [
                        ...new Set(
                            item.plans
                                .map((p) => p.planNumber)
                                .filter(Boolean)
                        ),
                    ],

                    planIds: [
                        ...new Set(
                            item.plans.map((p) =>
                                String(p.planId)
                            ),
                        ),
                    ],

                    boqRef: item.boqRef,
                    boqItemRef: item.boqItemRef,
                    description: item.description,
                    unit: item.unit,

                    plannedQty: roundQty(plannedQty),
                    actualQty: roundQty(actualQty),
                    seplQty: roundQty(actual.seplQty),
                    contractorQty: roundQty(actual.contractorQty),

                    remainingQty: roundQty(
                        Math.max(plannedQty - actualQty, 0)
                    ),

                    shortfallQty: roundQty(
                        Math.max(plannedQty - actualQty, 0)
                    ),

                    overachievementQty: roundQty(
                        Math.max(actualQty - plannedQty, 0)
                    ),

                    achievementPercent:
                        plannedQty > 0
                            ? Number(
                                (
                                    (actualQty / plannedQty) *
                                    100
                                ).toFixed(2)
                            )
                            : null,

                    // Useful for plan-level analysis.
                    plans: item.plans,

                    // Material-wise breakup for report page 3.
                    dailyBreakup,
                };
            }
        );

        // Summary totals use each BOQ item only once.
        const totals = reportItems.reduce(
            (acc, item) => {
                acc.plannedQty += item.plannedQty;
                acc.actualQty += item.actualQty;
                acc.seplQty += item.seplQty;
                acc.contractorQty += item.contractorQty;
                acc.remainingQty += item.remainingQty;
                acc.shortfallQty += item.shortfallQty;
                acc.overachievementQty += item.overachievementQty;
                return acc;
            },
            {
                plannedQty: 0,
                actualQty: 0,
                seplQty: 0,
                contractorQty: 0,
                remainingQty: 0,
                shortfallQty: 0,
                overachievementQty: 0,
            }
        );

        totals.achievementPercent =
            totals.plannedQty > 0
                ? Number(
                    (
                        (totals.actualQty / totals.plannedQty) *
                        100
                    ).toFixed(2)
                )
                : null;

        // Overall daily summary, sorted chronologically.
        const dailyBreakup = [...overallDayMap.values()]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((day) => ({
                ...day,
                actualQty: roundQty(day.actualQty),
                seplQty: roundQty(day.seplQty),
                contractorQty: roundQty(day.contractorQty),
            }));



        // Add new Amount logic 
        const idleItemDetails = reportItems.filter(
            (item) =>
                Number(item.plannedQty || 0) > 0 &&
                Number(item.actualQty || 0) <= 0
        );

        // const targetAmount =1;

        const actualAmount = mbEntries.reduce((sum, entry) => {
            if (entry.executedByType !== "SEPL") return sum;

            const entryAmount =
                entry.amount != null
                    ? Number(entry.amount)
                    : Number(entry.todayQty || 0) * Number(entry.rate || 0);

            return sum + entryAmount;
        }, 0);

        const contractorAmount = mbEntries.reduce((sum, entry) => {
            if (entry.executedByType !== "CONTRACTOR") return sum;

            const entryAmount =
                entry.amount != null
                    ? Number(entry.amount)
                    : Number(entry.todayQty || 0) * Number(entry.rate || 0);

            return sum + entryAmount;
        }, 0);

        const plannedItemIds = new Set(itemMap.keys());

        const unplannedActualAmount = mbEntries.reduce((sum, entry) => {
            if (entry.executedByType !== "SEPL") return sum;

            const boqItemId = String(
                entry.boqItemRef?._id || entry.boqItemRef || ""
            );

            if (plannedItemIds.has(boqItemId)) return sum;

            const entryAmount =
                entry.amount != null
                    ? Number(entry.amount)
                    : Number(entry.todayQty || 0) * Number(entry.rate || 0);

            return sum + entryAmount;
        }, 0);

        totals.targetAmount = Number(targetAmount.toFixed(2));
        totals.actualAmount = Number(actualAmount.toFixed(2));
        totals.contractorAmount = Number(contractorAmount.toFixed(2));
        totals.unplannedActualAmount = Number(unplannedActualAmount.toFixed(2));
        totals.idleItems = idleItemDetails.length;

        totals.amountAchievementPercent =
            totals.targetAmount > 0
                ? Number(
                    (
                        (totals.actualAmount / totals.targetAmount) *
                        100
                    ).toFixed(2)
                )
                : null;


        return res.status(200).json({
            success: true,
            message: "Monthly Work Plan report generated.",
            data: {
                projectRef,
                month,
                periodStart: start,
                periodEndExclusive: end,

                approvedPlanCount: plans.length,
                boqItemCount: reportItems.length,
                approvedMBEntryCount: mbEntries.length,

                totals,
                items: reportItems,

                // Daily totals across all report materials.
                dailyBreakup,
            },
        });
    } catch (error) {
        console.error(
            "Monthly Work Plan Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate monthly Work Plan report.",
            error: error.message,
        });
    }
};

