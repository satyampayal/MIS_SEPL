const express = require("express");
const ChallanRouter = express.Router();

const {
  createChallan,
  approveChallan,
  rejectChallan,
  getAllChallans,
  getChallanPickerItems,
  getChallansByMRQ,
  updateChallanBeforeApproval,
  requestChallanCorrection,
} = require("../controllers/challanController");

const upload = require("../config/multer");
const { isAuthenticated} =require('../middleware/auth.midlleware')

ChallanRouter.get("/all",isAuthenticated, getAllChallans);

ChallanRouter.get("/by-mrq/:mrqId", isAuthenticated, getChallansByMRQ);

ChallanRouter.post("/create",isAuthenticated, createChallan);

ChallanRouter.put("/approve/:id",isAuthenticated, approveChallan);

ChallanRouter.put("/reject/:id",isAuthenticated, rejectChallan);


ChallanRouter.get("/picker-items", getChallanPickerItems);

ChallanRouter.put(
  "/update-before-approval/:id",
  isAuthenticated,
  updateChallanBeforeApproval
);

ChallanRouter.put("/request-correction/:id", isAuthenticated, requestChallanCorrection);

module.exports = ChallanRouter;