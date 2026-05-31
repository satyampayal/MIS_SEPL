const express = require("express");
const SiteStoreStockRouter = express.Router();

const {
  getSiteLiveStock,
  getSiteStockBySite,
  getSingleSiteStock,
  adjustSiteStock,
  getLowSiteStock,
  addSiteOpeningStock,
  bulkSiteOpeningStockUpload,
} = require("../controllers/siteStoreStockController");
const uploadExcel = require("../config/multerExcel");
SiteStoreStockRouter.get("/live-stock", getSiteLiveStock);

SiteStoreStockRouter.get("/low-stock", getLowSiteStock);

SiteStoreStockRouter.get("/site/:siteId", getSiteStockBySite);

SiteStoreStockRouter.get("/:id", getSingleSiteStock);

SiteStoreStockRouter.put("/adjust/:id", adjustSiteStock);

SiteStoreStockRouter.post("/add-opening-stock", addSiteOpeningStock);

SiteStoreStockRouter.post( "/bulk-opening-stock", uploadExcel.single("excelFile"), bulkSiteOpeningStockUpload);
module.exports = SiteStoreStockRouter;