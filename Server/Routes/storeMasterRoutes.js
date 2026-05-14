const express = require('express');
const {getAllMasterStores,createMasterStore} = require('../controllers/masterStoreContoller');

const storeMasterRouter = express.Router();

// Define routes
storeMasterRouter.post('/create', createMasterStore);
storeMasterRouter.get('/all', getAllMasterStores);

module.exports = storeMasterRouter;