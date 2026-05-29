const express = require("express");
const projectMaterialPlanningRouter = express.Router();

const {
  createProjectBoqItem,
  getProjectBoqItems,
  getSingleProjectBoqItem,
  updateProjectBoqItem,
  deleteProjectBoqItem,
  addMaterialDelivery,
  getDeliveryHistoryByBoqItem,
  getDeliveryHistoryByProject,
  markInstalledQuantity,
  getProcurementPressureReport,
  bulkUploadProjectBoq,
} = require("../controllers/projectMaterialPlanningController");
const uploadExcel = require("../config/multerExcel");

// BOQ Item CRUD
projectMaterialPlanningRouter.post("/boq-item/create", createProjectBoqItem);
projectMaterialPlanningRouter.get("/boq-item/project/:projectId", getProjectBoqItems);
projectMaterialPlanningRouter.get("/boq-item/get/:boqItemId", getSingleProjectBoqItem);
projectMaterialPlanningRouter.put("/boq-item/update/:boqItemId", updateProjectBoqItem);
projectMaterialPlanningRouter.delete("/boq-item/delete/:boqItemId", deleteProjectBoqItem);
projectMaterialPlanningRouter.post("/boq-item/bulk-upload",  uploadExcel.single("boqFile"), bulkUploadProjectBoq);


// Delivery
projectMaterialPlanningRouter.post("/delivery/add", addMaterialDelivery);
projectMaterialPlanningRouter.get("/delivery/history/boq-item/:boqItemId", getDeliveryHistoryByBoqItem);
projectMaterialPlanningRouter.get("/delivery/history/project/:projectId", getDeliveryHistoryByProject);

// Installation
projectMaterialPlanningRouter.put("/installation/mark/:boqItemId", markInstalledQuantity);

// Report
projectMaterialPlanningRouter.get("/pressure-report/:projectId", getProcurementPressureReport);

module.exports = projectMaterialPlanningRouter;