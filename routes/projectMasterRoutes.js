const express=require('express')

const projectMasterRouter=express.Router();
const {addProject, getAllProjects, deleteProject}=require('../controllers/projectMasterController');
const upload = require('../config/multer');

projectMasterRouter.post('/create',upload.single("poFile"),addProject)
projectMasterRouter.get('/all',getAllProjects)
projectMasterRouter.delete('/delete/:projectId',deleteProject) 



module.exports=projectMasterRouter;