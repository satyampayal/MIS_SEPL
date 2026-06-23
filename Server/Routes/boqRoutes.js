const express = require("express");
const boqRouter = express.Router();

const excelMulter = require("../config/multerExcel");

const {
  createBOQ,
  getAllBOQByProject,
  getSingleBOQ,
  deleteBOQ,
  addBOQItem,
  updateBOQItem,
  deleteBOQItem,
  uploadBOQExcelItems,
  getBOQItemsByBOQ,
  getBOQByProject,
  suggestBOQItems,
  getAllBOQ
} = require("../controllers/boqController");

// BOQ MASTER
boqRouter.post("/create", createBOQ);

// SMART BOQ SUGGESTION FOR DPR
// Example: /boq/suggest?projectRef=xxx&query=tray fitting
boqRouter.get("/suggest", suggestBOQItems);

// All Boq
boqRouter.get("/all", getAllBOQ);
// PROJECT-WISE BOQ LIST
// Example: /boq/project/xxx?boqType=CONTRACTOR&status=ACTIVE
boqRouter.get("/project/:projectId", getBOQByProject);


// BOQ ITEMS
boqRouter.get("/items/:boqId", getBOQItemsByBOQ);
boqRouter.post("/:boqId/item", addBOQItem);
boqRouter.put("/item/:itemId", updateBOQItem);
boqRouter.delete("/item/:itemId", deleteBOQItem);

// EXCEL UPLOAD
boqRouter.post(
  "/:boqId/upload-excel",
  excelMulter.single("excelFile"),
  uploadBOQExcelItems
);

// SINGLE BOQ / DELETE BOQ
// Keep these LAST because :boqId can catch other routes
boqRouter.get("/:boqId", getSingleBOQ);
boqRouter.delete("/:boqId", deleteBOQ);

module.exports = boqRouter;