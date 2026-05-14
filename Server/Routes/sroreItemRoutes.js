const express = require("express");
const StoreItemRouter = express.Router();

const {
  createStoreItem,
  getAllStoreItems,
  getSingleStoreItem,
  updateStoreItem,
  deleteStoreItem,
  updateStock,
  getAvailableItemsForChallan,
  bulkUploadStoreItems,
} = require("../controllers/storeItemController");

const upload = require("../config/multer");
const uploadExcel=require('../config/multerExcel')

StoreItemRouter.post("/add", upload.single("itemImage"), createStoreItem);

StoreItemRouter.get("/all", getAllStoreItems);

StoreItemRouter.get("/challan-items", getAvailableItemsForChallan);

StoreItemRouter.get("/:id", getSingleStoreItem);

StoreItemRouter.put("/update/:id", upload.single("itemImage"), updateStoreItem);

StoreItemRouter.delete("/deleteItem/:id", deleteStoreItem);

StoreItemRouter.put("/stock/:id", updateStock);

// Excel upload
StoreItemRouter.post("/bulk-upload", uploadExcel.single("excelFile"), bulkUploadStoreItems);

module.exports = StoreItemRouter;