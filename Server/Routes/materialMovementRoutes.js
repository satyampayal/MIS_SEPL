const express = require("express");
const uploadExcel = require("../config/multerExcel");

const {
  createMaterialMovement,
  bulkUploadMaterialMovement,
  getMaterialHistory,
  getItemHistory,
  previewMaterialMovementByTime,
  deleteMaterialMovementByTime,
} = require("../controllers/materialMovementController");

const materialMovementRouter = express.Router();

materialMovementRouter.post("/create", createMaterialMovement);
materialMovementRouter.post("/bulk-upload", uploadExcel.single("file"), bulkUploadMaterialMovement);
materialMovementRouter.get("/history", getMaterialHistory);
materialMovementRouter.get("/item-history", getItemHistory);
materialMovementRouter.get("/preview-by-time", previewMaterialMovementByTime);
materialMovementRouter.delete("/delete-by-time", deleteMaterialMovementByTime);

module.exports = materialMovementRouter;