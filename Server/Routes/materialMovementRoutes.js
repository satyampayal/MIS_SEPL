const express = require("express");
const uploadExcel = require("../config/multerExcel");

const {
  createMaterialMovement,
  bulkUploadMaterialMovement,
  getMaterialHistory,
  getItemHistory,
  previewMaterialMovementByTime,
  deleteMaterialMovementByTime,
  exportMaterialMovementExcel,
  updateMaterialMovement,
  getMaterialMovementAnalytics,
} = require("../controllers/materialMovementController");

const materialMovementRouter = express.Router();

materialMovementRouter.post("/create", createMaterialMovement);
materialMovementRouter.post("/bulk-upload", uploadExcel.single("file"), bulkUploadMaterialMovement);
materialMovementRouter.get("/history", getMaterialHistory);
materialMovementRouter.get("/item-history", getItemHistory);
materialMovementRouter.get("/preview-by-time", previewMaterialMovementByTime);
materialMovementRouter.delete("/delete-by-time", deleteMaterialMovementByTime);
materialMovementRouter.get("/export-excel", exportMaterialMovementExcel);
materialMovementRouter.put("/update/:id", updateMaterialMovement);
materialMovementRouter.get("/analytics", getMaterialMovementAnalytics);

module.exports = materialMovementRouter;