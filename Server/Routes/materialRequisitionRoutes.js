const express = require("express");
const MRQRouter = express.Router();

const {
  createMaterialRequisition,
  updateMaterialRequisitionById,
  getAllMaterialRequisitions,
  getMaterialRequisitionById,
  approveMaterialRequisition,
  rejectMaterialRequisition,
  exportMRQExcel
} = require("../controllers/materialRequisitionController");

const {  isAuthenticated } = require("../middleware/auth.midlleware");

MRQRouter.post("/create", isAuthenticated, createMaterialRequisition);
MRQRouter.put("/update/:id", isAuthenticated, updateMaterialRequisitionById);
MRQRouter.get("/all", isAuthenticated, getAllMaterialRequisitions);
MRQRouter.get("/:id", isAuthenticated, getMaterialRequisitionById);
MRQRouter.put("/approve/:id", isAuthenticated, approveMaterialRequisition);
MRQRouter.put("/reject/:id", isAuthenticated, rejectMaterialRequisition);
MRQRouter.get(
  "/export/:id",
  isAuthenticated,
  exportMRQExcel
);
// MRQRouter.put("/mark-dc-plan/:id", isAuthenticated, markDCPlanCreated);
module.exports = MRQRouter;