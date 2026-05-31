const StockTransaction = require("../model/StockTransaction");

exports.getAllStockTransactions = async (req, res) => {
  try {
    const {
      itemRef,
      mainStoreRef,
      siteRef,
      transactionType,
      direction,
      fromDate,
      toDate,
      search,
    } = req.query;

    const query = {};

    if (itemRef) query.itemRef = itemRef;
    if (mainStoreRef) query.mainStoreRef = mainStoreRef;
    if (siteRef) query.siteRef = siteRef;
    if (transactionType) query.transactionType = transactionType;
    if (direction) query.direction = direction;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    if (search) {
      query.$or = [
        { referenceNumber: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await StockTransaction.find(query)
      .populate("itemRef", "itemName itemCode unit")
      .populate("mainStoreRef", "storeName storeCode")
      .populate("siteRef", "projectName name projectCode")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const summary = await StockTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalInQty: {
            $sum: {
              $cond: [{ $eq: ["$direction", "IN"] }, "$quantity", 0],
            },
          },
          totalOutQty: {
            $sum: {
              $cond: [{ $eq: ["$direction", "OUT"] }, "$quantity", 0],
            },
          },
          totalReservedQty: {
            $sum: {
              $cond: [{ $eq: ["$direction", "RESERVE"] }, "$quantity", 0],
            },
          },
          totalReleasedQty: {
            $sum: {
              $cond: [{ $eq: ["$direction", "RELEASE"] }, "$quantity", 0],
            },
          },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      summary: summary[0] || {
        totalTransactions: 0,
        totalInQty: 0,
        totalOutQty: 0,
        totalReservedQty: 0,
        totalReleasedQty: 0,
        totalAmount: 0,
      },
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getItemStockTimeline = async (req, res) => {
  try {
    const { itemId } = req.params;

    const records = await StockTransaction.find({ itemRef: itemId })
      .populate("itemRef", "itemName itemCode unit")
      .populate("mainStoreRef", "storeName storeCode")
      .populate("siteRef", "projectName name projectCode")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};