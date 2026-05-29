const MaterialMovement = require("../model/materialMovement");

const HEAD_STORE_IN_TYPES = ["MRN", "MRS", "In", "Return"];
const HEAD_STORE_OUT_TYPES = ["DC", "Out"]; // for safety

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
                    // From 29/05/2026 opening stock not need to inmaterial hitory we take from else 
                    // safeOpeningStock: {
                    //     $convert: {
                    //         input: "$openingStock",
                    //         to: "double",
                    //         onError: 0,
                    //         onNull: 0,
                    //     },
                    // },
                     safeOpeningStock: 0
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

                    openingStock: { $sum: "$safeOpeningStock" },
                    // openingStock:0,

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
                                { $eq: ["$typeOfTransit", "DC"] },
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
                        $sum: {
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

                    totalStockInQty: {
                        $add: ["$openingStock", "$totalReceivedQty"],
                    },

                    totalStockInValue: {
                        $add: ["$openingStockAmount", "$totalCostAmount"],
                    },

                    avgCostRate: {
                        $cond: [
                            { $gt: [{ $add: ["$openingStock", "$totalReceivedQty"] }, 0] },
                            {
                                $divide: [
                                    { $add: ["$openingStockAmount", "$totalCostAmount"] },
                                    { $add: ["$openingStock", "$totalReceivedQty"] },
                                ],
                            },
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
                    totalStockInQty: { $gt: 0 },
                },
            },

            {
                $addFields: {
                    currentStoreStockValue: {
                        $multiply: ["$availableQty", "$avgCostRate"],
                    },

                    currentStoreIssueValue: {
                        $multiply: ["$availableQty", "$avgCostRate"],
                    },
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
                    overIssuedItems: [
                        {
                            $match: {
                                availableQty: { $lt: 0 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                itemName: 1,
                                storeItemCode: 1,
                                uom: 1,
                                hsnCode: 1,
                                boqNo: 1,
                                openingStock: 1,
                                vendorInQty: 1,
                                siteReturnQty: 1,
                                totalReceivedQty: 1,
                                storeOutQty: 1,
                                availableQty: 1,
                                shortageQty: { $abs: "$availableQty" },
                                avgCostRate: 1,
                                currentStoreStockValue: 1,
                                lastDocumentNo: 1,
                                lastVendorName: 1,
                                lastReceivedDate: 1,
                                recordsCount: 1,
                                negativeStockValue: {
                                    $multiply: [
                                        { $abs: "$availableQty" },
                                        "$avgCostRate"
                                    ]
                                },
                            },
                        },
                        {
                            $sort: {
                                shortageQty: -1,
                            },
                        },
                    ],

                    summary: [
                        {
                            $group: {
                                _id: null,

                                totalCurrentStockValue: {
                                    $sum: "$currentStoreStockValue",
                                },

                                totalOpeningStockValue: {
                                    $sum: "$openingStockAmount",
                                },

                                totalMrnValue: {
                                    $sum: "$totalAmountMRN",
                                },

                                totalMrsValue: {
                                    $sum: "$totalAmountMRS",
                                },

                                totalDCValue: {
                                    $sum: "$totalAmountOutDC",
                                },

                                totalAvailableQty: {
                                    $sum: "$availableQty",
                                },

                                totalReceivedQty: {
                                    $sum: "$totalReceivedQty",
                                },

                                totalStockInQty: {
                                    $sum: "$totalStockInQty",
                                },

                                totalStockInValue: {
                                    $sum: "$totalStockInValue",
                                },

                                totalStoreOutQty: {
                                    $sum: "$storeOutQty",
                                },
                                negativeStockItems: {
                                    $sum: {
                                        $cond: [{ $lt: ["$availableQty", 0] }, 1, 0],
                                    },
                                },

                                totalNegativeQty: {
                                    $sum: {
                                        $cond: [
                                            { $lt: ["$availableQty", 0] },
                                            { $abs: "$availableQty" },
                                            0,
                                        ],
                                    },
                                },
                                totalNegativeStockValue: {
                                    $sum: {
                                        $cond: [
                                            { $lt: ["$availableQty", 0] },
                                            {
                                                $multiply: [
                                                    { $abs: "$availableQty" },
                                                    "$avgCostRate"
                                                ]
                                            },
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ];

        const result = await MaterialMovement.aggregate(pipeline);

        const items = result[0]?.data || [];
        const totalItems = result[0]?.totalCount[0]?.count || 0;
        const overIssuedItems = result[0]?.overIssuedItems || [];

        const summary = result[0]?.summary[0] || {
            totalCurrentStockValue: 0,
            totalOpeningStockValue: 0,
            totalMrnValue: 0,
            totalMrsValue: 0,
            totalDCValue: 0,
            totalAvailableQty: 0,
            totalReceivedQty: 0,
            totalStockInQty: 0,
            totalStockInValue: 0,
            totalStoreOutQty: 0,
        };

        return res.status(200).json({
            success: true,
            message: "Head store received items fetched successfully",
            totalItems,
            currentPage: Number(page),
            totalPages: Math.ceil(totalItems / Number(limit)),
            summary,

            overIssueCount: overIssuedItems.length,
            overIssuedItems,


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