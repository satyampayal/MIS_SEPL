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
  getProjectWiseMaterialHistory,
  getMaterialHistorySummary,
  getSingleProjectMaterialHistory,
  updateProjectNameGlobally,
  getProjectCategoryMaterialDetails,
  getProjectLiveStockReport,
  getHeadStoreLiveStockReport,
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
materialMovementRouter.get("/analytics/projects", getProjectWiseMaterialHistory);
materialMovementRouter.get("/analytics/summary", getMaterialHistorySummary);
materialMovementRouter.get(
  "/analytics/project/:projectName",
  getSingleProjectMaterialHistory
);
materialMovementRouter.get(
  "/analytics/project/:projectName/category/:category",
  getProjectCategoryMaterialDetails
);

materialMovementRouter.get(
  "/analytics/project-stock",
  getProjectLiveStockReport
);
materialMovementRouter.get(
  "/analytics/head-store-stock",
  getHeadStoreLiveStockReport
);



// Update the filed name
materialMovementRouter.put(
  "/update-project-name",
  updateProjectNameGlobally
);

module.exports = materialMovementRouter;