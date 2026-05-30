const express = require("express");
const StoreItemRouter = express.Router();

const {
  createStoreItem,
  getAllStoreItems,
  getSingleStoreItem,
  updateStoreItem,
  deleteStoreItem,
  getAvailableItemsForChallan,
  bulkUploadStoreItems,
} = require("../controllers/storeItemController");

const upload = require("../config/multer");
const uploadExcel = require("../config/multerExcel");

// Create Item Identity
StoreItemRouter.post(
  "/add",
  upload.single("itemImage"),
  createStoreItem
);

// Get All Item Identities
StoreItemRouter.get("/all", getAllStoreItems);

// For Challan Dropdown
StoreItemRouter.get(
  "/challan-items",
  getAvailableItemsForChallan
);

// Get Single Item Identity
StoreItemRouter.get("/:id", getSingleStoreItem);

// Update Item Identity
StoreItemRouter.put(
  "/update/:id",
  upload.single("itemImage"),
  updateStoreItem
);

// Soft Delete
StoreItemRouter.delete(
  "/deleteItem/:id",
  deleteStoreItem
);

// Bulk Upload Item Identity
StoreItemRouter.post(
  "/bulk-upload",
  uploadExcel.single("excelFile"),
  bulkUploadStoreItems
);

module.exports = StoreItemRouter;