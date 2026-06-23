const express = require("express");
const measurementBookRouter = express.Router();

const {
  createMBEntry,
  createBulkMBEntries,
  getMBEntries,
  submitMBEntry,
  approveMBEntry,
  rejectMBEntry,
  getMBBoqPickerItems,
  getSingleMBEntry,
  updateMBEntry,
  deleteMBEntry
} = require("../controllers/measurementBookController");

// Create MB draft
measurementBookRouter.post("/create", createMBEntry);

// Create MB with multiple Items 
measurementBookRouter.post("/create-bulk", createBulkMBEntries);

// Get MB entries with filters
// Example:
// /measurement-book/all?projectRef=xxx&approvalStatus=PENDING
measurementBookRouter.get("/all", getMBEntries);

// Submit draft/rejected MB for approval
measurementBookRouter.put("/submit/:id", submitMBEntry);

// Approve pending MB
measurementBookRouter.put("/approve/:id", approveMBEntry);

// Reject pending MB
measurementBookRouter.put("/reject/:id", rejectMBEntry);

//MB BOQ Picker Items
measurementBookRouter.get("/boq-picker/:projectId",getMBBoqPickerItems);


measurementBookRouter.get("/:id", getSingleMBEntry);

measurementBookRouter.put("/:id", updateMBEntry);

measurementBookRouter.delete("/:id", deleteMBEntry);

module.exports = measurementBookRouter;