const MaterialMovement = require("../model/materialMovement");


const HEAD_STORE_IN_TYPES = ["MRN", "MRS", "In", "Return"];
// const HEAD_STORE_OUT_TYPES = ["DC", "DDC", "LPN", "Out"];
const HEAD_STORE_OUT_TYPES = ["DC","Out"];

exports.getHeadStoreReceivedItems = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 2000000000 } = req.query;

        const matchQuery = {
            itemName: { $exists: true, $ne: "" },
            typeOfTransit: {
                $in: [...HEAD_STORE_IN_TYPES, ...HEAD_STORE_OUT_TYPES],
            },
        };

        if (search) {
            matchQuery.$or = [
                { itemName: { $regex: search, $options: "i" } },
                { storeItemCode: { $regex: search, $options: "i" } },
                { hsnCode: { $regex: search, $options: "i" } },
                { boqNo: { $regex: search, $options: "i" } },
                { vendorName: { $regex: search, $options: "i" } },
                { documentNo: { $regex: search, $options: "i" } },
                { invoiceNumber: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const pipeline = [
            { $match: matchQuery },

            {
                $addFields: {
                    safeQty: {
                        $convert: {
                            input: "$quantity",
                            to: "double",
                            onError: 0,
                            onNull: 0,
                        },
                    },
                    safeRate: {
                        $convert: {
                            input: "$rate",
                            to: "double",
                            onError: 0,
                            onNull: 0,
                        },
                    },
                    safeOpeningStock: {
                        $convert: {
                            input: "$openingStock",
                            to: "double",
                            onError: 0,
                            onNull: 0,
                        },
                    },
                },
            },

            {
                $group: {
                    _id: {
                        itemName: "$itemName",
                        storeItemCode: "$storeItemCode",
                        uom: "$uom",
                        hsnCode: "$hsnCode",
                        boqNo: "$boqNo",
                    },

                    itemName: { $first: "$itemName" },
                    storeItemCode: { $first: "$storeItemCode" },
                    uom: { $first: "$uom" },
                    hsnCode: { $first: "$hsnCode" },
                    boqNo: { $first: "$boqNo" },

                    category: { $first: "$category" },
                    commodity: { $first: "$commodity" },
                    mepHead: { $first: "$mepHead" },

                    openingStock: { $max: "$safeOpeningStock" },

                    vendorInQty: {
                        $sum: {
                            $cond: [{ $eq: ["$typeOfTransit", "MRN"] }, "$safeQty", 0],
                        },
                    },

                    siteReturnQty: {
                        $sum: {
                            $cond: [{ $eq: ["$typeOfTransit", "MRS"] }, "$safeQty", 0],
                        },
                    },

                    storeOutQty: {
                        $sum: {
                            $cond: [
                                { $in: ["$typeOfTransit", HEAD_STORE_OUT_TYPES] },
                                "$safeQty",
                                0,
                            ],
                        },
                    },

                    totalReceivedQty: {
                        $sum: {
                            $cond: [
                                { $in: ["$typeOfTransit", HEAD_STORE_IN_TYPES] },
                                "$safeQty",
                                0,
                            ],
                        },
                    },

                    totalCostAmount: {
                        $sum: {
                            $cond: [
                                { $in: ["$typeOfTransit", HEAD_STORE_IN_TYPES] },
                                { $multiply: ["$safeQty", "$safeRate"] },
                                0,
                            ],
                        },
                    },
                    // NEW CALCULATIONS
                    totalAmountMRN: {
                        $sum: {
                            $cond: [
                                { $eq: ["$typeOfTransit", "MRN"] },
                                { $multiply: ["$safeQty", "$safeRate"] },
                                0,
                            ],
                        },
                    },

                    totalAmountMRS: {
                        $sum: {
                            $cond: [
                                { $eq: ["$typeOfTransit", "MRS"] },
                                { $multiply: ["$safeQty", "$safeRate"] },
                                0,
                            ],
                        },
                    },

                    totalAmountOutDC: {
                        $sum: {
                            $cond: [
                                { $in: ["$typeOfTransit", HEAD_STORE_OUT_TYPES] },
                                { $multiply: ["$safeQty", "$safeRate"] },
                                0,
                            ],
                        },
                    },

                    openingStockAmount: {
                        $max: {
                            $multiply: ["$safeOpeningStock", "$safeRate"],
                        },
                    },

                    fixedUnitRate: { $max: "$safeRate" },

                    lastPurchaseRate: { $last: "$safeRate" },
                    lastReceivedDate: { $max: "$documentDate" },
                    lastDocumentNo: { $last: "$documentNo" },
                    lastVendorName: { $last: "$vendorName" },

                    recordsCount: { $sum: 1 },
                },
            },

            {
                $addFields: {
                    availableQty: {
                        $subtract: [
                            { $add: ["$openingStock", "$totalReceivedQty"] },
                            "$storeOutQty",
                        ],
                    },

                    // frontend can also calculate, but backend sends raw values safely
                    avgCostRate: {
                        $cond: [
                            { $gt: ["$totalReceivedQty", 0] },
                            { $divide: ["$totalCostAmount", "$totalReceivedQty"] },
                            0,
                        ],
                    },

                    storeIssueRate: 0,
                    profitPerUnit: 0,
                    estimatedProfitValue: 0,

                },
            },

            {
                $match: {
                    totalReceivedQty: { $gt: 0 },
                },
            },
            {
                $addFields: {
                    availableQty: {
                        $subtract: [
                            { $add: ["$openingStock", "$totalReceivedQty"] },
                            "$storeOutQty",
                        ],
                    },

                    avgCostRate: {
                        $cond: [
                            { $gt: ["$totalReceivedQty", 0] },
                            { $divide: ["$totalCostAmount", "$totalReceivedQty"] },
                            0,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    currentStoreStockValue: {
                        $multiply: ["$availableQty", "$fixedUnitRate"],
                    },

                    storeIssueRate: 0,

                    currentStoreIssueValue: {
                        $multiply: ["$availableQty", "$fixedUnitRate"],
                    },

                    // profitPerUnit: {
                    //     $subtract: [0, "$avgCostRate"],
                    // },

                    // estimatedProfitValue: {
                    //     $multiply: [
                    //         "$availableQty",
                    //         { $subtract: [0, "$avgCostRate"] },
                    //     ],
                    // },
                    profitPerUnit: 0,
                    estimatedProfitValue: 0,


                },
            },

            {
                $facet: {
                    data: [
                        { $sort: { lastReceivedDate: -1 } },
                        { $skip: skip },
                        { $limit: Number(limit) },
                    ],
                    totalCount: [{ $count: "count" }],
                },
            },
        ];

        const result = await MaterialMovement.aggregate(pipeline);

        const items = result[0]?.data || [];
        const totalItems = result[0]?.totalCount[0]?.count || 0;

        return res.status(200).json({
            success: true,
            message: "Head store received items fetched successfully",
            totalItems,
            currentPage: Number(page),
            totalPages: Math.ceil(totalItems / Number(limit)),
            items,

        });
    } catch (error) {
        console.error("Head Store Received Items Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch head store received items",
            error: error.message,
        });
    }
};