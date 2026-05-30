const express = require("express");
const ItemIdentityRouter = express.Router();

const {
  createItemIdentity,
  getAllItemIdentities,
  getSingleItemIdentity,
  updateItemIdentity,
  deleteItemIdentity,
  bulkUploadItemIdentities,
} = require("../controllers/itemIdentityController");

const upload = require("../config/multer");
const uploadExcel = require("../config/multerExcel");

ItemIdentityRouter.post("/add", upload.single("itemImage"), createItemIdentity);

ItemIdentityRouter.get("/all", getAllItemIdentities);

ItemIdentityRouter.get("/:id", getSingleItemIdentity);

ItemIdentityRouter.put(
  "/update/:id",
  upload.single("itemImage"),
  updateItemIdentity
);

ItemIdentityRouter.delete("/delete/:id", deleteItemIdentity);

ItemIdentityRouter.post(
  "/bulk-upload",
  uploadExcel.single("excelFile"),
  bulkUploadItemIdentities
);

module.exports = ItemIdentityRouter;