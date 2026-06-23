const express = require("express");
const dprRouter = express.Router();

const {
  createDPR,
  getAllDPR,
  getSingleDPR,
  // getDPRByProjectId,
  updateDPR,
  deleteDPR,
  verifyDPR,
  rejectDPR,
  // filterDPR,
  // getMonthlyContractorReport,
  // getMonthlyProjectReport,
} = require("../controllers/DPRController");
const {isAuthenticated}= require('../middleware/auth.midlleware')

const upload = require("../config/multer");

// Create DPR
// dprRouter.post("/create", upload.array("photos", 10), createDPR);

dprRouter.post("/create", createDPR);

dprRouter.get("/all", getAllDPR);

dprRouter.get("/:id", getSingleDPR);

dprRouter.put("/:id", updateDPR);

dprRouter.delete("/:id", deleteDPR);

dprRouter.put("/:id/verify", verifyDPR);
dprRouter.put("/:id/reject", rejectDPR);

// // Get all DPR
// dprRouter.get("/all", getAllDPR);

// // Filter DPR
// dprRouter.get("/filter", filterDPR);

// // Get particular DPR
// dprRouter.get("/particular/:dprId", getParticularDPR);

// // Get DPR by project id
// dprRouter.get("/project/:projectId", getDPRByProjectId);

// // Update DPR
// dprRouter.put("/update/:dprId", upload.array("photos", 10), updateDPR);

// // Delete DPR
// dprRouter.delete("/delete/:dprId", deleteDPR);

// // Monthly contractor payment report
// dprRouter.get(
//   "/monthly-contractor-report",
//   getMonthlyContractorReport
// );

// // Monthly project progress report
// dprRouter.get(
//   "/monthly-project-report",
//   getMonthlyProjectReport
// );

module.exports = dprRouter;