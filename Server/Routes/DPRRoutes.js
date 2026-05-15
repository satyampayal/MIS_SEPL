const express = require("express");
const dprRouter = express.Router();

const {
  createDPR,
  getAllDPR,
  getParticularDPR,
  getDPRByProjectId,
  updateDPR,
  deleteDPR,
  filterDPR,
  getMonthlyContractorReport,
  getMonthlyProjectReport,
} = require("../controllers/DPRController");

const upload = require("../config/multer");

// Create DPR
dprRouter.post("/create", upload.array("photos", 10), createDPR);

// Get all DPR
dprRouter.get("/all", getAllDPR);

// Filter DPR
dprRouter.get("/filter", filterDPR);

// Get particular DPR
dprRouter.get("/particular/:dprId", getParticularDPR);

// Get DPR by project id
dprRouter.get("/project/:projectId", getDPRByProjectId);

// Update DPR
dprRouter.put("/update/:dprId", upload.array("photos", 10), updateDPR);

// Delete DPR
dprRouter.delete("/delete/:dprId", deleteDPR);

// Monthly contractor payment report
dprRouter.get(
  "/monthly-contractor-report",
  getMonthlyContractorReport
);

// Monthly project progress report
dprRouter.get(
  "/monthly-project-report",
  getMonthlyProjectReport
);

module.exports = dprRouter;