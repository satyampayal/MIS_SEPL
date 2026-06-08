const express = require("express");
const ProcuremnetPlanRouter = express.Router();

const {
  createProcurementPlan,
  getAllProcurementPlans,
  getProcurementPlanById,
  updateProcurementItemMode,
} = require("../controllers/procurementPlanController");

const { isAuthenticated } = require("../middleware/auth.midlleware");

ProcuremnetPlanRouter.post("/create", isAuthenticated, createProcurementPlan);
ProcuremnetPlanRouter.get("/all", isAuthenticated, getAllProcurementPlans);
ProcuremnetPlanRouter.get("/:id", isAuthenticated, getProcurementPlanById);
ProcuremnetPlanRouter.put("/:planId/item/:itemId/mode", isAuthenticated, updateProcurementItemMode);

module.exports = ProcuremnetPlanRouter;