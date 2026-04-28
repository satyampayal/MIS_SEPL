const express = require("express");
const storeRouter = express.Router();

const {createStoreItem, createBulkStoreItem, uploadStoreExcel} =require('../controllers/storeController');
const upload = require("../config/multer");

storeRouter.post('/item-create',createStoreItem)
storeRouter.post('/bulk-item-create',createBulkStoreItem)
storeRouter.post('/upload-excel',upload.single('file'),uploadStoreExcel)

module.exports=storeRouter;