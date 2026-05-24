const TaxInvoice = require("../model/taxInvoiceRegisterSchema");

// 1. Summary Cards
exports.getTaxInvoiceSummary = async (req, res) => {
  try {
    const invoices = await TaxInvoice.find();

    const totalInvoices = invoices.length;

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.invoiceAmount || 0),
      0
    );

    const pendingDeliveries = invoices.filter(
      (inv) => inv.deliveryStatus?.toLowerCase() === "pending"
    ).length;

    const differenceCases = invoices.filter(
      (inv) => inv.materialDifference === "Difference Found"
    ).length;

    const challanCreated = invoices.filter(
      (inv) => inv.challanCreated?.toLowerCase() === "yes"
    ).length;

    const challanPercentage =
      totalInvoices > 0
        ? Math.round((challanCreated / totalInvoices) * 100)
        : 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyBilling = invoices
      .filter((inv) => {
        const date = new Date(inv.invoiceDate);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, inv) => sum + Number(inv.invoiceAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        totalAmount,
        pendingDeliveries,
        differenceCases,
        monthlyBilling,
        challanPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tax invoice summary error",
      error: error.message,
    });
  }
};

//Monthly 
exports.getMonthlyInvoiceTrend = async (req, res) => {
  try {
    const result = await TaxInvoice.aggregate([
      {
        $addFields: {
          convertedDate: { $toDate: "$invoiceDate" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$convertedDate" },
            month: { $month: "$convertedDate" },
          },
          
          totalAmount: { $sum: "$invoiceAmount" },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const formatted = result.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      totalAmount: item.totalAmount,
      totalInvoices: item.totalInvoices,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Monthly invoice trend error",
      error: error.message,
    });
  }
};

// Vendor
exports.getVendorAnalysis = async (req, res) => {
  try {
    const result = await TaxInvoice.aggregate([
      {
        $group: {
          _id: "$vendorName",
          totalAmount: { $sum: "$invoiceAmount" },
          totalInvoices: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    const formatted = result.map((item) => ({
      vendorName: item._id || "Unknown",
      totalAmount: item.totalAmount,
      totalInvoices: item.totalInvoices,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vendor analysis error",
      error: error.message,
    });
  }
};

//Site Analysis
exports.getProjectAnalysis = async (req, res) => {
  try {
    const result = await TaxInvoice.aggregate([
      {
        $group: {
          _id: "$projectSite",
          totalAmount: { $sum: "$invoiceAmount" },
          totalInvoices: { $sum: 1 },
          pendingDeliveries: {
            $sum: {
              $cond: [{ $eq: ["$deliveryStatus", "pending"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const formatted = result.map((item) => ({
      projectSite: item._id || "Unknown",
      totalAmount: item.totalAmount,
      totalInvoices: item.totalInvoices,
      pendingDeliveries: item.pendingDeliveries,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Project analysis error",
      error: error.message,
    });
  }
};

// Delivery
exports.getDeliveryStatus = async (req, res) => {
  try {
    const result = await TaxInvoice.aggregate([
      {
        $group: {
          _id: "$deliveryStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const formatted = result.map((item) => ({
      status: item._id || "Not Updated",
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delivery status error",
      error: error.message,
    });
  }
};

// Differnce Alerts
exports.getDifferenceAlerts = async (req, res) => {
  try {
    const alerts = await TaxInvoice.find({
      materialDifference: "Difference Found",
    })
      .select(
        "invoiceNumber vendorName projectSite quantitySent quantityReceived materialDifference"
      )
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Difference alerts error",
      error: error.message,
    });
  }
};