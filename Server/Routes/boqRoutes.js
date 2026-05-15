const express = require("express");
const boqRouter = express.Router();
const excelMulter=require('../config/multerExcel')

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
  // getBOQByProjectName,
  getBOQByProject
} = require("../controllers/boqController");

boqRouter.post("/create", createBOQ);
boqRouter.get("/project/:projectId", getAllBOQByProject);
boqRouter.get("/:boqId", getSingleBOQ);
boqRouter.delete("/:boqId", deleteBOQ);

boqRouter.post("/:boqId/item", addBOQItem);
boqRouter.put("/item/:itemId", updateBOQItem);
boqRouter.delete("/item/:itemId", deleteBOQItem);
boqRouter.post("/:boqId/upload-excel", excelMulter.single("excelFile"), uploadBOQExcelItems);
boqRouter.get("/items/:boqId", getBOQItemsByBOQ);
boqRouter.get(
  "/project/:projectId",
  getBOQByProject
);
module.exports = boqRouter;