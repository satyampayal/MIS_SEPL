const express = require("express");
const ChallanRouter = express.Router();

const {
  createChallan,
  approveChallan,
  rejectChallan,
  getAllChallans,
  getChallanPickerItems,
} = require("../controllers/challanController");

const upload = require("../config/multer");
const { isAuthenticated} =require('../middleware/auth.midlleware')

ChallanRouter.get("/all",isAuthenticated, getAllChallans);


ChallanRouter.post("/create",isAuthenticated, createChallan);

ChallanRouter.put("/approve/:id",isAuthenticated, approveChallan);

ChallanRouter.put("/reject/:id",isAuthenticated, rejectChallan);


ChallanRouter.get("/picker-items", getChallanPickerItems);

module.exports = ChallanRouter;