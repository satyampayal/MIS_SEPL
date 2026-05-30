const express = require("express");
const MainStoreStockRouter = express.Router();

const {
  addOpeningStock,
  getLiveStock,
  getSingleStock,
  adjustStock,
  getLowStock,
  getNegativeStock,
} = require("../controllers/mainStoreStockController");

MainStoreStockRouter.post("/add-opening-stock", addOpeningStock);

MainStoreStockRouter.get("/live-stock", getLiveStock);

MainStoreStockRouter.get("/low-stock", getLowStock);

MainStoreStockRouter.get("/negative-stock", getNegativeStock);

MainStoreStockRouter.get("/:id", getSingleStock);

MainStoreStockRouter.put("/adjust/:id", adjustStock);

module.exports = MainStoreStockRouter;