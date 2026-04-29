const express = require("express");
const storeRouter = express.Router();

const {createStoreItem, createBulkStoreItem, uploadStoreExcel, getAllItems, deleteStoreItem} =require('../controllers/storeController');
// const upload = require("../config/multer");
const uploadExcel = require("../config/multerExcel");

storeRouter.post('/item-create',createStoreItem)
storeRouter.post('/bulk-item-create',createBulkStoreItem)
storeRouter.post('/upload-excel',uploadExcel.single('file'),uploadStoreExcel)
storeRouter.get('/getAllItems',getAllItems)
storeRouter.delete('/deleteItem/:id',deleteStoreItem)

module.exports=storeRouter;