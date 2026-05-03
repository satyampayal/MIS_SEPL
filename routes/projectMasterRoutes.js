const express=require('express')

const projectMasterRouter=express.Router();
const {addProject, getAllProjects, deleteProject, getProjectById, updateProject}=require('../controllers/projectMasterController');
const upload = require('../config/multer');

projectMasterRouter.post('/create',upload.single("poFile"),addProject)
projectMasterRouter.get('/all',getAllProjects)
projectMasterRouter.delete('/delete/:projectId',deleteProject) 
projectMasterRouter.get('/get/:projectId',getProjectById)
projectMasterRouter.put('/update/:projectId',upload.single('poFile'),updateProject)



module.exports=projectMasterRouter;