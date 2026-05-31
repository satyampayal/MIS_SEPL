const express = require("express");
const MainStoreStockRouter = express.Router();

const {
  addOpeningStock,
  getLiveStock,
  getSingleStock,
  adjustStock,
  getLowStock,
  getNegativeStock,
  bulkMainOpeningStockUpload,
  updateMainStoreStock,
  deleteMainStoreStock,
} = require("../controllers/mainStoreStockController");
const uploadExcel = require("../config/multerExcel");

MainStoreStockRouter.post("/add-opening-stock", addOpeningStock);

MainStoreStockRouter.get("/live-stock", getLiveStock);

MainStoreStockRouter.get("/low-stock", getLowStock);

MainStoreStockRouter.get("/negative-stock", getNegativeStock);

MainStoreStockRouter.get("/:id", getSingleStock);

MainStoreStockRouter.put("/adjust/:id", adjustStock);

MainStoreStockRouter.post("/bulk-opening-stock", uploadExcel.single("excelFile"),
  bulkMainOpeningStockUpload);

MainStoreStockRouter.put("/update/:id", updateMainStoreStock);

MainStoreStockRouter.delete("/delete/:id", deleteMainStoreStock);

module.exports = MainStoreStockRouter;