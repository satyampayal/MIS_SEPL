const express = require("express");
const uploadExcel = require("../config/multerExcel");

const {
  createMaterialMovement,
  bulkUploadMaterialMovement,
  getMaterialHistory,
  getItemHistory,
} = require("../controllers/materialMovementController");

const materialMovementRouter = express.Router();

materialMovementRouter.post("/create", createMaterialMovement);
materialMovementRouter.post("/bulk-upload", uploadExcel.single("file"), bulkUploadMaterialMovement);
materialMovementRouter.get("/history", getMaterialHistory);
materialMovementRouter.get("/item-history", getItemHistory);

module.exports = materialMovementRouter;