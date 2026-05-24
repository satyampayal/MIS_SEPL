const express = require("express");
const analyticalRouter = express.Router();

const {
  getTaxInvoiceSummary,
  getMonthlyInvoiceTrend,
  getVendorAnalysis,
  getProjectAnalysis,
  getDeliveryStatus,
  getDifferenceAlerts,
} = require("../controllers/analyticsController");

analyticalRouter.get("/tax-invoice/summary", getTaxInvoiceSummary);
analyticalRouter.get("/tax-invoice/monthly-trend", getMonthlyInvoiceTrend);
analyticalRouter.get("/tax-invoice/vendor-analysis", getVendorAnalysis);
analyticalRouter.get("/tax-invoice/project-analysis", getProjectAnalysis);
analyticalRouter.get("/tax-invoice/delivery-status", getDeliveryStatus);
analyticalRouter.get("/tax-invoice/difference-alerts", getDifferenceAlerts);

module.exports = analyticalRouter;