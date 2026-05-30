const express = require("express");
const SiteStoreStockRouter = express.Router();

const {
  getSiteLiveStock,
  getSiteStockBySite,
  getSingleSiteStock,
  adjustSiteStock,
  getLowSiteStock,
} = require("../controllers/siteStoreStockController");

SiteStoreStockRouter.get("/live-stock", getSiteLiveStock);

SiteStoreStockRouter.get("/low-stock", getLowSiteStock);

SiteStoreStockRouter.get("/site/:siteId", getSiteStockBySite);

SiteStoreStockRouter.get("/:id", getSingleSiteStock);

SiteStoreStockRouter.put("/adjust/:id", adjustSiteStock);

module.exports = SiteStoreStockRouter;