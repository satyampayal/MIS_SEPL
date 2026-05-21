const express = require("express");
const uploadExcel = require("../config/multerExcel");

const {
  createMaterialMovement,
  bulkUploadMaterialMovement,
  getMaterialHistory,
  getItemHistory,
} = require("../controllers/materialMovementController");

const router = express.Router();

router.post("/create", createMaterialMovement);
router.post("/bulk-upload", uploadExcel.single("file"), bulkUploadMaterialMovement);
router.get("/history", getMaterialHistory);
router.get("/item-history", getItemHistory);

module.exports = router;