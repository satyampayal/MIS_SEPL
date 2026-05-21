const express=require('express')

const projectMasterRouter=express.Router();
const {addProject, getAllProjects, deleteProject, getProjectById, updateProject, addBillToProject, getProjectBills, deleteProjectBill, updateBill, getProjectFinancialSummary}=require('../controllers/projectMasterController');
const upload = require('../config/multer');

projectMasterRouter.post('/create',upload.single("poFile"),addProject)
projectMasterRouter.get('/all',getAllProjects)
projectMasterRouter.delete('/delete/:projectId',deleteProject) 
projectMasterRouter.get('/get/:projectId',getProjectById)
projectMasterRouter.put('/update/:projectId',upload.single('poFile'),updateProject)
projectMasterRouter.post('/add/bill/:projectId',upload.single('billFile'),addBillToProject)
projectMasterRouter.get('/get/bill/:projectId',getProjectBills)
projectMasterRouter.delete('/delete/bill/:billId/:projectId',deleteProjectBill)
projectMasterRouter.put('/update/bill/:billId',upload.single('billFile'),updateBill)

projectMasterRouter.get(
  "/financial-summary/:projectId",
  getProjectFinancialSummary
);

module.exports=projectMasterRouter;