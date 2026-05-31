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

ChallanRouter.post("/create", upload.single("challanFile"), createChallan);

ChallanRouter.put("/approve/:id", approveChallan);

ChallanRouter.put("/reject/:id", rejectChallan);

ChallanRouter.get("/all", getAllChallans);

ChallanRouter.get("/picker-items", getChallanPickerItems);

module.exports = ChallanRouter;